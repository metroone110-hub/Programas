import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../models/models.dart';
import '../services/ticket_service.dart';
import '../theme/app_theme.dart';

class TicketsScreen extends StatefulWidget {
  final TicketService ticketService;

  const TicketsScreen({super.key, required this.ticketService});

  @override
  State<TicketsScreen> createState() => _TicketsScreenState();
}

class _TicketsScreenState extends State<TicketsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showTicketDetails(MealTicket ticket) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Pull Bar
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // Official Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'CROU DE KORHOGO',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: 0.5),
                      ),
                      Text(
                        'UNIVERSITÉ PELEFORO GBON COULIBALY',
                        style: TextStyle(fontSize: 10, color: Colors.grey.shade600, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: ticket.status == 'valid'
                          ? AppTheme.success.withValues(alpha: 0.1)
                          : Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      ticket.status == 'valid' ? 'VALIDE' : 'UTILISÉ',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: ticket.status == 'valid' ? AppTheme.success : Colors.grey.shade700,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // QR Code in White Box
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: QrImageView(
                  data: ticket.qrCodeData,
                  version: QrVersions.auto,
                  size: 190.0,
                ),
              ),

              const SizedBox(height: 16),

              Text(
                ticket.ticketNumber,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.2,
                  fontFamily: 'monospace',
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${ticket.studentName ?? "Étudiant"} • ${ticket.studentMatricule ?? ""}',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w500),
              ),

              const SizedBox(height: 16),

              // Ticket Details Row
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Repas :', style: TextStyle(fontSize: 12, color: Colors.grey)),
                        Text(ticket.dishName, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Service :', style: TextStyle(fontSize: 12, color: Colors.grey)),
                        Text(ticket.mealType == 'midi' ? 'Déjeuner (Midi)' : 'Dîner (Soir)',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Tarif subventionné :', style: TextStyle(fontSize: 12, color: Colors.grey)),
                        Text('${ticket.price} FCFA',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primary)),
                      ],
                    ),
                    if (ticket.status == 'used' && ticket.usedAt != null) ...[
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Validé au tourniquet :', style: TextStyle(fontSize: 12, color: Colors.grey)),
                          Text(ticket.usedAt!,
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
                        ],
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 20),

              const Text(
                'Présentez ce QR Code face au scanner optique de la borne tourniquet pour débloquer votre passage.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11, color: Colors.grey, height: 1.4),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final validTickets = widget.ticketService.validTickets;
    final usedTickets = widget.ticketService.usedTickets;

    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        title: const Text('Mes Tickets Repas'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondaryLight,
          indicatorColor: AppTheme.primary,
          indicatorWeight: 3,
          tabs: [
            Tab(text: 'Prêts au passage (${validTickets.length})'),
            Tab(text: 'Historique (${usedTickets.length})'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Valid Tickets
          validTickets.isEmpty
              ? _buildEmptyState('Aucun ticket actif', 'Achetez votre repas à 200 FCFA depuis le menu du jour.')
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: validTickets.length,
                  itemBuilder: (ctx, i) => _buildTicketCard(validTickets[i]),
                ),

          // Tab 2: Used Tickets
          usedTickets.isEmpty
              ? _buildEmptyState('Aucun ticket utilisé', 'Vos passages aux tourniquets apparaîtront ici.')
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: usedTickets.length,
                  itemBuilder: (ctx, i) => _buildTicketCard(usedTickets[i]),
                ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String title, String subtitle) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.confirmation_number_outlined, size: 40, color: Colors.grey.shade400),
          ),
          const SizedBox(height: 16),
          Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(subtitle, style: TextStyle(fontSize: 13, color: Colors.grey.shade500)),
        ],
      ),
    );
  }

  Widget _buildTicketCard(MealTicket ticket) {
    final isValid = ticket.status == 'valid';

    return GestureDetector(
      onTap: () => _showTicketDetails(ticket),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.borderLight),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Left: QR Thumbnail
              Container(
                width: 60,
                height: 60,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: QrImageView(
                  data: ticket.qrCodeData,
                  version: QrVersions.auto,
                ),
              ),
              const SizedBox(width: 14),

              // Middle: Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      ticket.dishName,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      ticket.ticketNumber,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: AppTheme.textSecondaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Émis le ${ticket.purchaseDate}',
                      style: const TextStyle(fontSize: 11, color: AppTheme.textSecondaryLight),
                    ),
                  ],
                ),
              ),

              // Right: Status Badge & Chevron
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: isValid ? AppTheme.success.withValues(alpha: 0.1) : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      isValid ? 'VALIDE' : 'UTILISÉ',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: isValid ? AppTheme.success : Colors.grey.shade600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.textSecondaryLight),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
