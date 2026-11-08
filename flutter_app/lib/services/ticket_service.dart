import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import '../models/models.dart';
import 'auth_service.dart';

class TicketService extends ChangeNotifier {
  final AuthService authService;

  TicketService(this.authService);

  List<MealTicket> get tickets => authService.currentUser?.savedTickets ?? [];

  List<MealTicket> get validTickets =>
      tickets.where((t) => t.status == 'valid').toList();

  List<MealTicket> get usedTickets =>
      tickets.where((t) => t.status == 'used').toList();

  Future<Map<String, dynamic>> purchaseTicket({
    required Dish dish,
    required String paymentMethod, // 'balance' | 'wave'
  }) async {
    final user = authService.currentUser;
    if (user == null) {
      return {'success': false, 'message': 'Utilisateur non connecté.'};
    }

    if (user.isBlocked) {
      return {'success': false, 'message': 'Compte bloqué. Achat impossible.'};
    }

    // 200 FCFA tarif officiel subventionné
    const int price = 200;

    if (paymentMethod == 'balance' && user.balance < price) {
      return {
        'success': false,
        'message': 'Solde insuffisant (${user.balance} FCFA). Veuillez recharger via Wave.'
      };
    }

    final randomId = Random().nextInt(899999) + 100000;
    final ticketNumber = 'CROUK-2026-$randomId';
    final now = DateTime.now();
    final validUntil = now.add(const Duration(days: 7));

    final newTicket = MealTicket(
      id: 'tkt_${now.millisecondsSinceEpoch}_$randomId',
      ticketNumber: ticketNumber,
      dishId: dish.id,
      dishName: dish.name,
      mealType: dish.mealType,
      price: price,
      purchaseDate: DateFormat('dd/MM/yyyy HH:mm').format(now),
      validUntil: DateFormat('dd/MM/yyyy').format(validUntil),
      status: 'valid',
      qrCodeData: 'https://programas.crouk.ci/verify?tkt=$ticketNumber&mat=${user.matricule ?? user.uid}',
      studentMatricule: user.matricule ?? user.uid,
      studentName: user.displayName,
    );

    final updatedTickets = List<MealTicket>.from(user.savedTickets)..insert(0, newTicket);
    final updatedBalance = paymentMethod == 'balance' ? user.balance - price : user.balance;

    final updatedUser = user.copyWith(
      balance: updatedBalance,
      savedTickets: updatedTickets,
    );

    await authService.updateUser(updatedUser);
    notifyListeners();

    return {
      'success': true,
      'ticket': newTicket,
      'message': 'Ticket $ticketNumber émis avec succès !'
    };
  }

  Future<Map<String, dynamic>> validateTicketAtTurnstile(String ticketNumber) async {
    final user = authService.currentUser;
    if (user == null) {
      return {'status': 'error', 'message': 'Session non trouvée.'};
    }

    final cleanNum = ticketNumber.trim().toUpperCase();
    final index = user.savedTickets.indexWhere((t) => t.ticketNumber.toUpperCase() == cleanNum);

    if (index == -1) {
      return {
        'status': 'invalid',
        'message': 'Ticket introuvable ou non reconnu par le serveur CROU.'
      };
    }

    final ticket = user.savedTickets[index];
    if (ticket.status == 'used') {
      return {
        'status': 'already_used',
        'message': 'ALERTE : Ce ticket a déjà été validé à ${ticket.usedAt ?? "la borne"}. Passage refusé.'
      };
    }

    final updatedTicket = MealTicket(
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      dishId: ticket.dishId,
      dishName: ticket.dishName,
      mealType: ticket.mealType,
      price: ticket.price,
      purchaseDate: ticket.purchaseDate,
      validUntil: ticket.validUntil,
      status: 'used',
      qrCodeData: ticket.qrCodeData,
      studentMatricule: ticket.studentMatricule,
      studentName: ticket.studentName,
      usedAt: DateFormat('dd/MM/yyyy HH:mm:ss').format(DateTime.now()),
    );

    final updatedList = List<MealTicket>.from(user.savedTickets);
    updatedList[index] = updatedTicket;

    await authService.updateUser(user.copyWith(savedTickets: updatedList));
    notifyListeners();

    return {
      'status': 'valid',
      'ticket': updatedTicket,
      'message': 'Passage accordé ! Bon appétit.'
    };
  }

  Future<Map<String, dynamic>> transferTicket({
    required String ticketNumber,
    required String recipientMatricule,
  }) async {
    final user = authService.currentUser;
    if (user == null) {
      return {'success': false, 'message': 'Utilisateur non connecté.'};
    }

    if (user.isBlocked) {
      return {'success': false, 'message': 'Compte bloqué.'};
    }

    final cleanNum = ticketNumber.trim().toUpperCase();
    final cleanRecipient = recipientMatricule.trim().toUpperCase();

    if (cleanRecipient.isEmpty || cleanRecipient.length < 4) {
      return {'success': false, 'message': 'Matricule étudiant destinataire invalide.'};
    }

    if (cleanRecipient == (user.matricule ?? '').toUpperCase()) {
      return {'success': false, 'message': 'Vous ne pouvez pas transférer un ticket à vous-même.'};
    }

    final index = user.savedTickets.indexWhere((t) => t.ticketNumber.toUpperCase() == cleanNum && t.status == 'valid');
    if (index == -1) {
      return {'success': false, 'message': 'Ticket valide introuvable.'};
    }

    final ticket = user.savedTickets[index];
    final updatedList = List<MealTicket>.from(user.savedTickets)..removeAt(index);
    await authService.updateUser(user.copyWith(savedTickets: updatedList));
    notifyListeners();

    return {
      'success': true,
      'message': 'Ticket ${ticket.ticketNumber} transféré avec succès au matricule $cleanRecipient !'
    };
  }
}
