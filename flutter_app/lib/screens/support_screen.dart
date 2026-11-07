import 'package:flutter/material.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';

class SupportMessage {
  final String text;
  final bool isUser;
  final String time;

  SupportMessage({required this.text, required this.isUser, required this.time});
}

class SupportScreen extends StatefulWidget {
  final List<Dish> dishes;

  const SupportScreen({super.key, required this.dishes});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _messageController = TextEditingController();
  final List<SupportMessage> _messages = [
    SupportMessage(
      text: 'Bonjour cher(e) étudiant(e) ! 👋 Je suis M. Kouassi, agent d\'accueil et d\'orientation au Service Restauration du CROU Korhogo (UPGC).\n\nJe suis à votre disposition pour vous renseigner sur le réfectoire :\n• Les plats du jour et spécialités 🍲\n• Vos tickets de repas subventionnés à 200 FCFA 🎫\n• Les horaires de service midi & soir ⏰\n• La sécurité de votre compte et code PIN 🔒\n\nComment puis-je vous aider aujourd\'hui ?',
      isUser: false,
      time: 'Maintenant',
    ),
  ];

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  void _sendMessage([String? predefinedText]) {
    final text = (predefinedText ?? _messageController.text).trim();
    if (text.isEmpty) return;

    final now = TimeOfDay.now().format(context);
    setState(() {
      _messages.add(SupportMessage(text: text, isUser: true, time: now));
    });

    _messageController.clear();

    // Human response logic
    Future.delayed(const Duration(milliseconds: 600), () {
      if (!mounted) return;
      final reply = _generateCounselorResponse(text);
      setState(() {
        _messages.add(SupportMessage(text: reply, isUser: false, time: TimeOfDay.now().format(context)));
      });
    });
  }

  String _generateCounselorResponse(String prompt) {
    final p = prompt.toLowerCase();

    if (p.contains('salut') || p.contains('bonjour') || p.contains('bonsoir') || p.contains('coucou')) {
      return 'Bonjour ! Ravi de vous accueillir au guichet d\'assistance du CROU Korhogo. Comment se passent vos cours à l\'UPGC ? Que souhaitez-vous savoir pour votre repas d\'aujourd\'hui ?';
    }

    if (p.contains('prix') || p.contains('tarif') || p.contains('combien') || p.contains('coûte')) {
      return 'Le ticket de repas complet est subventionné par l\'État de Côte d\'Ivoire au tarif officiel de 200 FCFA (+10 FCFA de frais de service Wave = 210 FCFA). Vous pouvez commander et régler directement depuis votre application !';
    }

    if (p.contains('menu') || p.contains('manger') || p.contains('plat') || p.contains('nourriture')) {
      final menuList = widget.dishes.map((d) => '• ${d.name} (${d.mealType == "midi" ? "Midi" : "Soir"})').join('\n');
      return 'Voici les plats préparés aujourd\'hui par notre équipe de cuisine :\n\n$menuList\n\nLe repas complet est servi avec accompagnement au tarif de 200 FCFA.';
    }

    if (p.contains('horaire') || p.contains('heure') || p.contains('ferme') || p.contains('ouvert')) {
      return 'Les horaires de service au Restaurant Universitaire sont les suivants :\n\n• Déjeuner : 11h30 à 14h30\n• Dîner : 18h30 à 21h00\n\nPensez à ouvrir votre QR code avant d\'arriver aux tourniquets pour faciliter le passage.';
    }

    if (p.contains('mot de passe') || p.contains('oubli') || p.contains('recuper')) {
      return 'Pour la sécurité absolue de vos tickets et éviter toute usurpation, la réinitialisation de mot de passe en ligne est désactivée.\n\nVeuillez vous présenter au Guichet Restauration du CROU Korhogo avec votre carte d\'étudiant physique pour faire réinitialiser votre accès.';
    }

    if (p.contains('merci')) {
      return 'Avec grand plaisir ! L\'équipe du CROU Korhogo vous souhaite un très bon appétit et d\'excellentes révisions pour vos cours à l\'UPGC ! 😊';
    }

    return 'Je suis à votre écoute ! Pour toute demande concernant le restaurant universitaire, les tickets à 200 FCFA ou le passage aux bornes tourniquets, n\'hésitez pas à me solliciter.';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.support_agent, color: Colors.white, size: 22),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('M. Kouassi • Conseiller CROU', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                Text('Service Restauration UPGC • En direct', style: TextStyle(fontSize: 10, color: AppTheme.success)),
              ],
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Quick suggestion chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            child: Row(
              children: [
                _buildChip('Menu du jour', 'Qu\'y a-t-il au menu aujourd\'hui ?'),
                _buildChip('Prix du repas', 'Quel est le prix du ticket repas ?'),
                _buildChip('Horaires réfectoire', 'Quels sont les horaires d\'ouverture ?'),
                _buildChip('Mot de passe oublié', 'Comment réinitialiser mon mot de passe ?'),
              ],
            ),
          ),

          const Divider(height: 1, color: AppTheme.borderLight),

          // Chat Messages
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (ctx, i) {
                final m = _messages[i];
                return Align(
                  alignment: m.isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: m.isUser ? AppTheme.primary : Colors.white,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(16),
                        topRight: const Radius.circular(16),
                        bottomLeft: Radius.circular(m.isUser ? 16 : 4),
                        bottomRight: Radius.circular(m.isUser ? 4 : 16),
                      ),
                      border: m.isUser ? null : Border.all(color: AppTheme.borderLight),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (!m.isUser)
                          const Padding(
                            padding: EdgeInsets.only(bottom: 4),
                            child: Text(
                              'M. Kouassi (CROU-K)',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primary),
                            ),
                          ),
                        Text(
                          m.text,
                          style: TextStyle(
                            fontSize: 13,
                            color: m.isUser ? Colors.white : AppTheme.textPrimaryLight,
                            height: 1.4,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Align(
                          alignment: Alignment.bottomRight,
                          child: Text(
                            m.time,
                            style: TextStyle(
                              fontSize: 9.5,
                              color: m.isUser ? Colors.white70 : AppTheme.textSecondaryLight,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Message Input Field
          SafeArea(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppTheme.borderLight)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      decoration: const InputDecoration(
                        hintText: 'Écrivez votre message à M. Kouassi...',
                        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    decoration: const BoxDecoration(
                      color: AppTheme.primary,
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      onPressed: () => _sendMessage(),
                      icon: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChip(String label, String message) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ActionChip(
        label: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
        backgroundColor: Colors.white,
        side: const BorderSide(color: AppTheme.borderLight),
        onPressed: () => _sendMessage(message),
      ),
    );
  }
}
