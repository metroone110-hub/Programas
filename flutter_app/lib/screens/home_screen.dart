import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/auth_service.dart';
import '../services/canteen_service.dart';
import '../services/ticket_service.dart';
import '../theme/app_theme.dart';
import 'support_screen.dart';
import 'tickets_screen.dart';

class HomeScreen extends StatefulWidget {
  final AuthService authService;
  final TicketService ticketService;
  final CanteenService canteenService;

  const HomeScreen({
    super.key,
    required this.authService,
    required this.ticketService,
    required this.canteenService,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _selectedMealType = 'midi'; // 'midi' | 'soir'

  void _showPurchaseDialog(Dish dish) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Achat de Ticket Repas',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(ctx),
                    icon: const Icon(Icons.close, size: 20),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.lightBackground,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.restaurant, color: AppTheme.primary),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            dish.name,
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Tarif subventionné État de Côte d\'Ivoire',
                            style: TextStyle(fontSize: 11, color: AppTheme.textSecondaryLight),
                          ),
                        ],
                      ),
                    ),
                    const Text(
                      '200 F',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: () async {
                  Navigator.pop(ctx);
                  final res = await widget.ticketService.purchaseTicket(
                    dish: dish,
                    paymentMethod: 'balance',
                  );

                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(res['message']),
                      backgroundColor: res['success'] ? AppTheme.success : AppTheme.danger,
                    ),
                  );
                },
                icon: const Icon(Icons.account_balance_wallet_outlined, size: 18),
                label: const Text('Payer avec mon Solde Étudiant (200 FCFA)'),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: () async {
                  Navigator.pop(ctx);
                  // Simuler paiement Wave Money
                  final res = await widget.ticketService.purchaseTicket(
                    dish: dish,
                    paymentMethod: 'wave',
                  );

                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(res['message']),
                      backgroundColor: res['success'] ? AppTheme.success : AppTheme.danger,
                    ),
                  );
                },
                icon: const Icon(Icons.phone_android, size: 18, color: Color(0xFF1D4ED8)),
                label: const Text(
                  'Payer immédiatement par Wave Money',
                  style: TextStyle(color: Color(0xFF1D4ED8), fontWeight: FontWeight.bold),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFF93C5FD)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.authService.currentUser;
    final canteen = widget.canteenService.selectedCanteen;
    final validCount = widget.ticketService.validTickets.length;
    final filteredDishes = widget.canteenService.dishes
        .where((d) => d.mealType == _selectedMealType)
        .toList();

    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Programas • CROU Korhogo'),
            Text(
              canteen.name,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: AppTheme.textSecondaryLight),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => TicketsScreen(ticketService: widget.ticketService),
                ),
              );
            },
            icon: Badge(
              isLabelVisible: validCount > 0,
              label: Text('$validCount'),
              backgroundColor: AppTheme.primary,
              child: const Icon(Icons.qr_code_rounded, size: 24),
            ),
          ),
          IconButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => SupportScreen(dishes: widget.canteenService.dishes),
                ),
              );
            },
            icon: const Icon(Icons.headset_mic_outlined, size: 22),
            tooltip: 'Assistance CROU',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => setState(() {}),
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            // Student Welcome & Balance Card (Bank style)
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.displayName ?? 'Étudiant UPGC',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            user?.matricule ?? 'CI0226019482',
                            style: const TextStyle(
                              color: AppTheme.textSecondaryDark,
                              fontSize: 12,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppTheme.primary.withValues(alpha: 0.5)),
                        ),
                        child: const Text(
                          '200 F / Repas',
                          style: TextStyle(
                            color: Color(0xFFFDBA74),
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'SOLDE DISPONIBLE',
                            style: TextStyle(
                              color: AppTheme.textSecondaryDark,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.6,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${user?.balance ?? 0} FCFA',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                      ElevatedButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => TicketsScreen(ticketService: widget.ticketService),
                            ),
                          );
                        },
                        icon: const Icon(Icons.confirmation_number_outlined, size: 16),
                        label: Text('Tickets ($validCount)'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Operational Hours & Crowd Banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.access_time_rounded, color: Color(0xFF2563EB), size: 20),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Horaires officiels du réfectoire',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Déjeuner : 11h30 – 14h30 • Dîner : 18h30 – 21h00',
                          style: TextStyle(fontSize: 11.5, color: AppTheme.textSecondaryLight),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Meal Switcher (Midi / Soir)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Menu du jour préparé',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.3,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () => setState(() => _selectedMealType = 'midi'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: _selectedMealType == 'midi' ? Colors.white : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Midi',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: _selectedMealType == 'midi' ? FontWeight.bold : FontWeight.normal,
                              color: _selectedMealType == 'midi' ? AppTheme.textPrimaryLight : AppTheme.textSecondaryLight,
                            ),
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () => setState(() => _selectedMealType = 'soir'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: _selectedMealType == 'soir' ? Colors.white : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Soir',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: _selectedMealType == 'soir' ? FontWeight.bold : FontWeight.normal,
                              color: _selectedMealType == 'soir' ? AppTheme.textPrimaryLight : AppTheme.textSecondaryLight,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Dishes Cards
            for (final dish in filteredDishes)
              Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          dish.imageUrl,
                          width: 84,
                          height: 84,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 84,
                            height: 84,
                            color: const Color(0xFFF1F5F9),
                            child: const Icon(Icons.restaurant, color: AppTheme.textSecondaryLight),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              dish.name,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14.5),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              dish.description,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryLight, height: 1.3),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      '${dish.price} FCFA',
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.primary,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      '${dish.regularPrice} F',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        decoration: TextDecoration.lineThrough,
                                        color: AppTheme.textSecondaryLight,
                                      ),
                                    ),
                                  ],
                                ),
                                ElevatedButton(
                                  onPressed: () => _showPurchaseDialog(dish),
                                  style: ElevatedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                    minimumSize: Size.zero,
                                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  ),
                                  child: const Text('Prendre ticket', style: TextStyle(fontSize: 12)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
