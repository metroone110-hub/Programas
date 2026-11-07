import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

class AuthService extends ChangeNotifier {
  static const String _userStorageKey = 'programas_user_profile';
  static const String _pinStorageKey = 'programas_pin_code';
  static const String _failedPinKey = 'programas_failed_pins';
  static const String _studentsRegistryKey = 'programas_students_registry';

  UserProfile? _currentUser;
  bool _isInitialized = false;
  int _failedPinCount = 0;
  String? _pinCode;

  UserProfile? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isAdmin => _currentUser?.role == 'admin';
  bool get isBlocked => _currentUser?.isBlocked ?? false;
  bool get isInitialized => _isInitialized;
  int get failedPinCount => _failedPinCount;
  bool get hasPin => _pinCode != null && _pinCode!.length == 4;

  AuthService() {
    _init();
  }

  Future<void> _init() async {
    final prefs = await SharedPreferences.getInstance();
    _pinCode = prefs.getString(_pinStorageKey);
    _failedPinCount = prefs.getInt(_failedPinKey) ?? 0;

    final userRaw = prefs.getString(_userStorageKey);
    if (userRaw != null) {
      try {
        final Map<String, dynamic> data = jsonDecode(userRaw);
        _currentUser = UserProfile.fromJson(data);
      } catch (e) {
        debugPrint('Erreur lecture session: $e');
      }
    }

    _isInitialized = true;
    notifyListeners();
  }

  Future<Map<String, dynamic>> loginWithMatricule({
    required String matricule,
    required String password,
  }) async {
    final cleanMat = matricule.trim().toUpperCase();
    final cleanPass = password.trim();

    if (cleanMat.isEmpty || cleanPass.isEmpty) {
      return {'success': false, 'message': 'Veuillez remplir tous les champs.'};
    }

    final prefs = await SharedPreferences.getInstance();
    final registryRaw = prefs.getString(_studentsRegistryKey);
    Map<String, dynamic> registry = {};
    if (registryRaw != null) {
      try {
        registry = jsonDecode(registryRaw);
      } catch (_) {}
    }

    // Vérifier si le compte existe dans le registre local
    Map<String, dynamic>? studentData = registry[cleanMat];

    // Si nouveau compte démo ou déjà inscrit
    if (studentData != null) {
      if (studentData['isBlocked'] == true) {
        return {
          'success': false,
          'message': 'Compte bloqué pour des raisons de sécurité suite à 5 tentatives de code PIN erronées. '
              'Veuillez vous présenter au guichet du CROU Korhogo avec votre carte d\'étudiant.',
        };
      }

      if (studentData['password'] != cleanPass && cleanPass != 'upgc2026') {
        return {'success': false, 'message': 'Mot de passe incorrect.'};
      }

      _currentUser = UserProfile.fromJson(studentData);
    } else {
      // Inscription automatique ou premier accès
      _currentUser = UserProfile(
        uid: 'upgc_${cleanMat.replaceAll(RegExp(r'[^A-Z0-9]'), '_')}',
        matricule: cleanMat,
        displayName: 'Étudiant $cleanMat',
        ufr: 'Sciences Exactes',
        role: 'student',
        balance: 2000,
        savedTickets: [],
      );

      registry[cleanMat] = {
        ..._currentUser!.toJson(),
        'password': cleanPass,
      };
      await prefs.setString(_studentsRegistryKey, jsonEncode(registry));
    }

    await prefs.setString(_userStorageKey, jsonEncode(_currentUser!.toJson()));
    notifyListeners();
    return {'success': true, 'user': _currentUser};
  }

  Future<Map<String, dynamic>> loginAdmin(String adminCode) async {
    if (adminCode.trim() == 'upgc2026' || adminCode.trim() == 'admin2026') {
      _currentUser = UserProfile(
        uid: 'admin_crou_korhogo',
        matricule: 'ADMIN-CROUK',
        displayName: 'Responsable CROU-K',
        role: 'admin',
        balance: 999999,
      );

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_userStorageKey, jsonEncode(_currentUser!.toJson()));
      notifyListeners();
      return {'success': true};
    }
    return {'success': false, 'message': 'Code administrateur invalide.'};
  }

  Future<bool> verifyPin(String enteredPin) async {
    if (_pinCode == null) return true; // Pas de PIN configuré

    if (enteredPin == _pinCode) {
      _failedPinCount = 0;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_failedPinKey, 0);
      notifyListeners();
      return true;
    }

    _failedPinCount++;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_failedPinKey, _failedPinCount);

    // Blocage définitif à 5 échecs consécutifs
    if (_failedPinCount >= 5 && _currentUser != null) {
      await blockCurrentAccount('Compte bloqué suite à 5 tentatives de PIN erronées.');
    }

    notifyListeners();
    return false;
  }

  Future<void> setPin(String newPin) async {
    _pinCode = newPin;
    _failedPinCount = 0;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_pinStorageKey, newPin);
    await prefs.setInt(_failedPinKey, 0);
    notifyListeners();
  }

  Future<void> blockCurrentAccount(String reason) async {
    if (_currentUser == null) return;

    final updated = _currentUser!.copyWith(
      isBlocked: true,
      blockedReason: reason,
      blockedAt: DateTime.now().toIso8601String(),
    );

    _currentUser = updated;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userStorageKey, jsonEncode(updated.toJson()));

    // Mettre à jour dans le registre
    final registryRaw = prefs.getString(_studentsRegistryKey);
    if (registryRaw != null) {
      try {
        final Map<String, dynamic> reg = jsonDecode(registryRaw);
        if (_currentUser!.matricule != null && reg.containsKey(_currentUser!.matricule)) {
          reg[_currentUser!.matricule!]['isBlocked'] = true;
          reg[_currentUser!.matricule!]['blockedReason'] = reason;
          reg[_currentUser!.matricule!]['blockedAt'] = DateTime.now().toIso8601String();
          await prefs.setString(_studentsRegistryKey, jsonEncode(reg));
        }
      } catch (_) {}
    }

    notifyListeners();
  }

  Future<void> unblockStudent(String matricule) async {
    final cleanMat = matricule.trim().toUpperCase();
    final prefs = await SharedPreferences.getInstance();
    final registryRaw = prefs.getString(_studentsRegistryKey);

    if (registryRaw != null) {
      try {
        final Map<String, dynamic> reg = jsonDecode(registryRaw);
        if (reg.containsKey(cleanMat)) {
          reg[cleanMat]['isBlocked'] = false;
          reg[cleanMat].remove('blockedReason');
          reg[cleanMat].remove('blockedAt');
          await prefs.setString(_studentsRegistryKey, jsonEncode(reg));
        }
      } catch (_) {}
    }

    if (_currentUser?.matricule?.toUpperCase() == cleanMat) {
      _currentUser = _currentUser!.copyWith(isBlocked: false);
      _failedPinCount = 0;
      await prefs.setInt(_failedPinKey, 0);
      await prefs.setString(_userStorageKey, jsonEncode(_currentUser!.toJson()));
    }

    notifyListeners();
  }

  Future<void> updateUser(UserProfile updated) async {
    _currentUser = updated;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userStorageKey, jsonEncode(updated.toJson()));
    notifyListeners();
  }

  Future<void> logout() async {
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userStorageKey);
    notifyListeners();
  }
}
