import 'package:flutter/material.dart';
import 'screens/admin_screen.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/pin_screen.dart';
import 'services/auth_service.dart';
import 'services/canteen_service.dart';
import 'services/ticket_service.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProgramasApp());
}

class ProgramasApp extends StatefulWidget {
  const ProgramasApp({super.key});

  @override
  State<ProgramasApp> createState() => _ProgramasAppState();
}

class _ProgramasAppState extends State<ProgramasApp> {
  late final AuthService _authService;
  late final TicketService _ticketService;
  late final CanteenService _canteenService;
  bool _isPinUnlocked = false;

  @override
  void initState() {
    super.initState();
    _authService = AuthService();
    _ticketService = TicketService(_authService);
    _canteenService = CanteenService();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Programas • CROU Korhogo',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: AnimatedBuilder(
        animation: _authService,
        builder: (context, _) {
          if (!_authService.isInitialized) {
            return const Scaffold(
              body: Center(
                child: CircularProgressIndicator(color: AppTheme.primary),
              ),
            );
          }

          // Non authentifié
          if (!_authService.isAuthenticated) {
            _isPinUnlocked = false;
            return LoginScreen(authService: _authService);
          }

          // Compte bloqué
          if (_authService.isBlocked) {
            return PinScreen(
              authService: _authService,
              onUnlocked: () => setState(() => _isPinUnlocked = true),
            );
          }

          // Administrateur CROU
          if (_authService.isAdmin) {
            return AdminScreen(
              authService: _authService,
              ticketService: _ticketService,
            );
          }

          // Étudiant avec PIN configuré et non encore déverrouillé
          if (_authService.hasPin && !_isPinUnlocked) {
            return PinScreen(
              authService: _authService,
              onUnlocked: () => setState(() => _isPinUnlocked = true),
            );
          }

          // Écran d'accueil principal étudiant
          return HomeScreen(
            authService: _authService,
            ticketService: _ticketService,
            canteenService: _canteenService,
          );
        },
      ),
    );
  }
}
