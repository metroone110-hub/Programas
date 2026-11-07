import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

class PinScreen extends StatefulWidget {
  final AuthService authService;
  final VoidCallback onUnlocked;

  const PinScreen({
    super.key,
    required this.authService,
    required this.onUnlocked,
  });

  @override
  State<PinScreen> createState() => _PinScreenState();
}

class _PinScreenState extends State<PinScreen> {
  String _enteredPin = '';
  String? _errorMessage;
  bool _isChecking = false;

  void _onDigitPressed(String digit) {
    if (_enteredPin.length >= 4 || _isChecking) return;

    setState(() {
      _enteredPin += digit;
      _errorMessage = null;
    });

    if (_enteredPin.length == 4) {
      _verifyPin();
    }
  }

  void _onDeletePressed() {
    if (_enteredPin.isEmpty || _isChecking) return;
    setState(() {
      _enteredPin = _enteredPin.substring(0, _enteredPin.length - 1);
      _errorMessage = null;
    });
  }

  Future<void> _verifyPin() async {
    setState(() => _isChecking = true);

    final success = await widget.authService.verifyPin(_enteredPin);

    if (!mounted) return;

    if (success) {
      widget.onUnlocked();
    } else {
      final fails = widget.authService.failedPinCount;
      final remaining = 5 - fails;

      setState(() {
        _isChecking = false;
        _enteredPin = '';
        if (remaining > 0) {
          _errorMessage = 'Code PIN incorrect. $remaining tentative${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}.';
        } else {
          _errorMessage = 'Compte bloqué suite à 5 tentatives de code PIN erronées.';
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.authService.currentUser;
    final fails = widget.authService.failedPinCount;
    final isBlocked = widget.authService.isBlocked || fails >= 5;

    return Scaffold(
      backgroundColor: AppTheme.darkBackground,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 380),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: isBlocked
                  ? _buildBlockedAccountView(user)
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Top Header
                        Column(
                          children: [
                            const SizedBox(height: 20),
                            Container(
                              width: 56,
                              height: 56,
                              decoration: BoxDecoration(
                                color: AppTheme.darkSurface,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppTheme.borderDark),
                              ),
                              child: const Icon(
                                Icons.lock_outline_rounded,
                                color: AppTheme.primary,
                                size: 28,
                              ),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Code PIN de sécurité',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              user != null
                                  ? '${user.displayName} • ${user.matricule ?? user.uid}'
                                  : 'Saisissez votre code personnel à 4 chiffres',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppTheme.textSecondaryDark,
                              ),
                            ),
                            const SizedBox(height: 24),

                            // 4 PIN Dots
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List.generate(4, (index) {
                                final isFilled = index < _enteredPin.length;
                                return Container(
                                  margin: const EdgeInsets.symmetric(horizontal: 8),
                                  width: 16,
                                  height: 16,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: isFilled ? AppTheme.primary : AppTheme.darkSurface,
                                    border: Border.all(
                                      color: isFilled ? AppTheme.primary : AppTheme.borderDark,
                                      width: 1.5,
                                    ),
                                  ),
                                );
                              }),
                            ),

                            const SizedBox(height: 16),

                            if (_errorMessage != null)
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                child: Text(
                                  _errorMessage!,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    color: AppTheme.danger,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                          ],
                        ),

                        // Numeric Keypad
                        _buildKeypad(),

                        // Bottom Actions
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: TextButton(
                            onPressed: () => widget.authService.logout(),
                            child: const Text(
                              'Se déconnecter',
                              style: TextStyle(
                                color: AppTheme.textSecondaryDark,
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildKeypad() {
    return Column(
      children: [
        for (var row in [
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['', '0', 'delete']
        ])
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: row.map((key) {
                if (key.isEmpty) {
                  return const SizedBox(width: 72, height: 72);
                }
                if (key == 'delete') {
                  return SizedBox(
                    width: 72,
                    height: 72,
                    child: IconButton(
                      onPressed: _onDeletePressed,
                      icon: const Icon(Icons.backspace_outlined, color: Colors.white, size: 24),
                    ),
                  );
                }
                return SizedBox(
                  width: 72,
                  height: 72,
                  child: ElevatedButton(
                    onPressed: () => _onDigitPressed(key),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.darkSurface,
                      foregroundColor: Colors.white,
                      shape: const CircleBorder(),
                      padding: EdgeInsets.zero,
                      elevation: 0,
                    ),
                    child: Text(
                      key,
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w600),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
      ],
    );
  }

  Widget _buildBlockedAccountView(UserProfile? user) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: AppTheme.danger.withValues(alpha: 0.15),
            shape: BoxShape.circle,
            border: Border.all(color: AppTheme.danger, width: 2),
          ),
          child: const Icon(Icons.shield_outlined, color: AppTheme.danger, size: 36),
        ),
        const SizedBox(height: 20),
        const Text(
          'Compte Étudiant Bloqué',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Votre compte a été automatiquement verrouillé par mesure de sécurité suite à 5 tentatives de code PIN erronées.\n\n'
            'Veuillez vous présenter au Guichet Restauration du CROU Korhogo muni de votre carte d\'étudiant physique pour lever le blocage.',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 13,
              color: AppTheme.textSecondaryDark,
              height: 1.5,
            ),
          ),
        ),
        const SizedBox(height: 28),
        ElevatedButton(
          onPressed: () => widget.authService.logout(),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.danger,
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
          ),
          child: const Text('Retour à la connexion'),
        ),
      ],
    );
  }
}
