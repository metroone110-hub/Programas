import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

class LoginScreen extends StatefulWidget {
  final AuthService authService;

  const LoginScreen({super.key, required this.authService});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _matriculeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _adminCodeController = TextEditingController();

  bool _isAdminMode = false;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _matriculeController.dispose();
    _passwordController.dispose();
    _adminCodeController.dispose();
    super.dispose();
  }

  Future<void> _handleStudentLogin() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await widget.authService.loginWithMatricule(
      matricule: _matriculeController.text,
      password: _passwordController.text,
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] != true) {
      setState(() => _errorMessage = res['message'] ?? 'Erreur de connexion');
    }
  }

  Future<void> _handleAdminLogin() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await widget.authService.loginAdmin(_adminCodeController.text);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] != true) {
      setState(() => _errorMessage = res['message'] ?? 'Code administrateur invalide');
    }
  }

  void _showForgottenPasswordDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.shield_outlined, color: AppTheme.primary, size: 24),
            SizedBox(width: 8),
            Text(
              'Récupération de compte',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: const Text(
          'Pour des motifs stricts de sécurité et de protection de vos tickets subventionnés à 200 FCFA, '
          'la réinitialisation de mot de passe en ligne est désactivée.\n\n'
          'En cas d\'oubli, veuillez vous présenter en personne au Guichet Restauration du CROU Korhogo '
          '(Bâtiment Administratif UPGC) muni de votre carte d\'étudiant physique pour une réactivation immédiate.',
          style: TextStyle(fontSize: 13, height: 1.5, color: AppTheme.textSecondaryLight),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Compris', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo & Header
                  Center(
                    child: Container(
                      width: 68,
                      height: 68,
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primary.withValues(alpha: 0.25),
                            blurRadius: 18,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.restaurant_rounded,
                        color: Colors.white,
                        size: 34,
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),

                  const Text(
                    'Programas',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.5,
                      color: AppTheme.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Centre Régional des Œuvres Universitaires • Korhogo\nUniversité Peleforo Gbon Coulibaly',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondaryLight,
                      height: 1.4,
                      fontWeight: FontWeight.w500,
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Mode Selector Segmented Pill
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() {
                              _isAdminMode = false;
                              _errorMessage = null;
                            }),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: !_isAdminMode ? Colors.white : Colors.transparent,
                                borderRadius: BorderRadius.circular(10),
                                boxShadow: !_isAdminMode
                                    ? [
                                        BoxShadow(
                                          color: Colors.black.withValues(alpha: 0.05),
                                          blurRadius: 4,
                                          offset: const Offset(0, 2),
                                        )
                                      ]
                                    : null,
                              ),
                              child: Text(
                                'Étudiant UPGC',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: !_isAdminMode ? FontWeight.bold : FontWeight.w500,
                                  color: !_isAdminMode ? AppTheme.textPrimaryLight : AppTheme.textSecondaryLight,
                                ),
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() {
                              _isAdminMode = true;
                              _errorMessage = null;
                            }),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: _isAdminMode ? Colors.white : Colors.transparent,
                                borderRadius: BorderRadius.circular(10),
                                boxShadow: _isAdminMode
                                    ? [
                                        BoxShadow(
                                          color: Colors.black.withValues(alpha: 0.05),
                                          blurRadius: 4,
                                          offset: const Offset(0, 2),
                                        )
                                      ]
                                    : null,
                              ),
                              child: Text(
                                'Administration CROU',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: _isAdminMode ? FontWeight.bold : FontWeight.w500,
                                  color: _isAdminMode ? AppTheme.textPrimaryLight : AppTheme.textSecondaryLight,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  if (_errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.danger.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.danger.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.error_outline, color: AppTheme.danger, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: const TextStyle(
                                fontSize: 12.5,
                                color: AppTheme.danger,
                                fontWeight: FontWeight.w600,
                                height: 1.35,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  if (!_isAdminMode) ...[
                    // Matricule Field
                    const Text(
                      'Numéro de matricule étudiant *',
                      style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppTheme.textPrimaryLight),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _matriculeController,
                      textCapitalization: TextCapitalization.characters,
                      decoration: const InputDecoration(
                        hintText: 'Ex: CI0226019482 ou UPGC-2026-001',
                        prefixIcon: Icon(Icons.badge_outlined, size: 20),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Password Field
                    const Text(
                      'Mot de passe *',
                      style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppTheme.textPrimaryLight),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        hintText: 'Votre mot de passe personnel',
                        prefixIcon: Icon(Icons.lock_outline, size: 20),
                      ),
                    ),

                    const SizedBox(height: 10),

                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: _showForgottenPasswordDialog,
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text(
                          'Mot de passe oublié ?',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.primary,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    ElevatedButton(
                      onPressed: _isLoading ? null : _handleStudentLogin,
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text('Se connecter / Accéder au réfectoire'),
                    ),
                  ] else ...[
                    // Admin PIN Field
                    const Text(
                      'Code de sécurité administration *',
                      style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppTheme.textPrimaryLight),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _adminCodeController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        hintText: 'Saisissez le code d\'administration',
                        prefixIcon: Icon(Icons.shield_outlined, size: 20),
                      ),
                    ),

                    const SizedBox(height: 24),

                    ElevatedButton(
                      onPressed: _isLoading ? null : _handleAdminLogin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.darkBackground,
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text('Accéder au portail d\'administration'),
                    ),
                  ],

                  const SizedBox(height: 32),

                  // Official Footer note
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.info_outline, color: AppTheme.textSecondaryLight, size: 18),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Tarif officiel subventionné par l\'État de Côte d\'Ivoire : 200 FCFA le repas complet.',
                            style: TextStyle(
                              fontSize: 11,
                              color: AppTheme.textSecondaryLight,
                              height: 1.35,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
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
}
