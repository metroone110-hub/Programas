import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/ticket_service.dart';
import '../theme/app_theme.dart';

class AdminScreen extends StatefulWidget {
  final AuthService authService;
  final TicketService ticketService;

  const AdminScreen({
    super.key,
    required this.authService,
    required this.ticketService,
  });

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  final _ticketScanController = TextEditingController();
  final _searchStudentController = TextEditingController();

  String? _scanResult;
  bool _isScanSuccess = false;

  @override
  void dispose() {
    _ticketScanController.dispose();
    _searchStudentController.dispose();
    super.dispose();
  }

  void _handleManualTurnstileValidation() async {
    final code = _ticketScanController.text.trim();
    if (code.isEmpty) return;

    final res = await widget.ticketService.validateTicketAtTurnstile(code);
    setState(() {
      _scanResult = res['message'];
      _isScanSuccess = res['status'] == 'valid';
    });
  }

  void _unblockStudentDialog(String matricule) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Débloquer le compte étudiant ?'),
        content: Text(
          'Voulez-vous réactiver l\'accès pour le matricule $matricule ?\n\n'
          'Les compteurs d\'échecs de sécurité et de PIN seront réinitialisés à 0.',
          style: const TextStyle(fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await widget.authService.unblockStudent(matricule);
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Le compte $matricule a été débloqué avec succès.'),
                  backgroundColor: AppTheme.success,
                ),
              );
              setState(() {});
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.success),
            child: const Text('Débloquer'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final validTickets = widget.ticketService.validTickets;
    final usedTickets = widget.ticketService.usedTickets;
    final totalSold = validTickets.length + usedTickets.length;
    final totalRevenue = totalSold * 200;

    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        title: const Text('Administration CROU Korhogo'),
        actions: [
          IconButton(
            onPressed: () => widget.authService.logout(),
            icon: const Icon(Icons.logout, size: 20),
            tooltip: 'Déconnexion Admin',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // 4 Bilan Cards
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.4,
            children: [
              _buildStatCard('TICKETS VENDUS', '$totalSold', '200 FCFA / repas', AppTheme.primary),
              _buildStatCard('REPAS VALIDÉS', '${usedTickets.length}', 'Passages tourniquets', AppTheme.success),
              _buildStatCard('EN CIRCULATION', '${validTickets.length}', 'Prêts au passage', const Color(0xFF2563EB)),
              _buildStatCard('RECETTES (FCFA)', '$totalRevenue', 'Total encaissé', Colors.black87),
            ],
          ),

          const SizedBox(height: 24),

          // Turnstile Scanner Box
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppTheme.borderLight),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.qr_code_scanner, color: AppTheme.primary, size: 22),
                    SizedBox(width: 8),
                    Text(
                      'Validation au Tourniquet (Contrôle Optique)',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'Saisissez ou scannez le numéro de ticket (ex: CROUK-2026-XXXXXX) pour autoriser le passage au self.',
                  style: TextStyle(fontSize: 12, color: AppTheme.textSecondaryLight),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _ticketScanController,
                        textCapitalization: TextCapitalization.characters,
                        decoration: const InputDecoration(
                          hintText: 'Numéro de ticket ou scan...',
                          prefixIcon: Icon(Icons.confirmation_number_outlined, size: 20),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    ElevatedButton(
                      onPressed: _handleManualTurnstileValidation,
                      child: const Text('Valider'),
                    ),
                  ],
                ),
                if (_scanResult != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: (_isScanSuccess ? AppTheme.success : AppTheme.danger).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: (_isScanSuccess ? AppTheme.success : AppTheme.danger).withValues(alpha: 0.3),
                      ),
                    ),
                    child: Text(
                      _scanResult!,
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.bold,
                        color: _isScanSuccess ? AppTheme.success : AppTheme.danger,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Security & Blocked Account Management
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppTheme.borderLight),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Gestion des comptes étudiants & Sécurité',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'En cas de blocage suite à 5 tentatives de code PIN erronées, l\'administrateur peut débloquer le compte après vérification de la carte physique.',
                  style: TextStyle(fontSize: 12, color: AppTheme.textSecondaryLight),
                ),
                const SizedBox(height: 14),

                // Demo blocked student card
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.danger.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.lock_person, color: AppTheme.danger, size: 20),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'KOUAME YAO JEAN',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            Text(
                              'Matricule : CI0226019482 • 5 échecs PIN',
                              style: TextStyle(fontSize: 11, color: AppTheme.danger),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () => _unblockStudentDialog('CI0226019482'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.success,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        child: const Text('Débloquer', style: TextStyle(fontSize: 11)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, String subtext, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: AppTheme.textSecondaryLight,
              letterSpacing: 0.5,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
          Text(
            subtext,
            style: const TextStyle(fontSize: 10.5, color: AppTheme.textSecondaryLight),
          ),
        ],
      ),
    );
  }
}
