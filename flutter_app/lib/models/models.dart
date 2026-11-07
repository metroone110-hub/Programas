class UserProfile {
  final String uid;
  final String? matricule;
  final String displayName;
  final String? email;
  final String? ufr;
  final String role; // 'student' | 'admin'
  final int balance;
  final List<MealTicket> savedTickets;
  final bool isBlocked;
  final String? blockedReason;
  final String? blockedAt;

  UserProfile({
    required this.uid,
    this.matricule,
    required this.displayName,
    this.email,
    this.ufr,
    this.role = 'student',
    this.balance = 0,
    this.savedTickets = const [],
    this.isBlocked = false,
    this.blockedReason,
    this.blockedAt,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      uid: json['uid'] ?? '',
      matricule: json['matricule'],
      displayName: json['displayName'] ?? 'Étudiant UPGC',
      email: json['email'],
      ufr: json['ufr'],
      role: json['role'] ?? 'student',
      balance: (json['balance'] as num?)?.toInt() ?? 0,
      savedTickets: (json['savedTickets'] as List<dynamic>?)
              ?.map((t) => MealTicket.fromJson(Map<String, dynamic>.from(t)))
              .toList() ??
          [],
      isBlocked: json['isBlocked'] == true,
      blockedReason: json['blockedReason'],
      blockedAt: json['blockedAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'matricule': matricule,
      'displayName': displayName,
      'email': email,
      'ufr': ufr,
      'role': role,
      'balance': balance,
      'savedTickets': savedTickets.map((t) => t.toJson()).toList(),
      'isBlocked': isBlocked,
      'blockedReason': blockedReason,
      'blockedAt': blockedAt,
    };
  }

  UserProfile copyWith({
    String? uid,
    String? matricule,
    String? displayName,
    String? email,
    String? ufr,
    String? role,
    int? balance,
    List<MealTicket>? savedTickets,
    bool? isBlocked,
    String? blockedReason,
    String? blockedAt,
  }) {
    return UserProfile(
      uid: uid ?? this.uid,
      matricule: matricule ?? this.matricule,
      displayName: displayName ?? this.displayName,
      email: email ?? this.email,
      ufr: ufr ?? this.ufr,
      role: role ?? this.role,
      balance: balance ?? this.balance,
      savedTickets: savedTickets ?? this.savedTickets,
      isBlocked: isBlocked ?? this.isBlocked,
      blockedReason: blockedReason ?? this.blockedReason,
      blockedAt: blockedAt ?? this.blockedAt,
    );
  }
}

class MealTicket {
  final String id;
  final String ticketNumber;
  final String dishId;
  final String dishName;
  final String mealType; // 'midi' | 'soir'
  final int price;
  final String purchaseDate;
  final String validUntil;
  final String status; // 'valid' | 'used' | 'expired'
  final String qrCodeData;
  final String? studentMatricule;
  final String? studentName;
  final String? usedAt;

  MealTicket({
    required this.id,
    required this.ticketNumber,
    required this.dishId,
    required this.dishName,
    required this.mealType,
    required this.price,
    required this.purchaseDate,
    required this.validUntil,
    required this.status,
    required this.qrCodeData,
    this.studentMatricule,
    this.studentName,
    this.usedAt,
  });

  factory MealTicket.fromJson(Map<String, dynamic> json) {
    return MealTicket(
      id: json['id'] ?? '',
      ticketNumber: json['ticketNumber'] ?? '',
      dishId: json['dishId'] ?? '',
      dishName: json['dishName'] ?? 'Repas complet Resto U',
      mealType: json['mealType'] ?? 'midi',
      price: (json['price'] as num?)?.toInt() ?? 200,
      purchaseDate: json['purchaseDate'] ?? '',
      validUntil: json['validUntil'] ?? '',
      status: json['status'] ?? 'valid',
      qrCodeData: json['qrCodeData'] ?? '',
      studentMatricule: json['studentMatricule'],
      studentName: json['studentName'],
      usedAt: json['usedAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ticketNumber': ticketNumber,
      'dishId': dishId,
      'dishName': dishName,
      'mealType': mealType,
      'price': price,
      'purchaseDate': purchaseDate,
      'validUntil': validUntil,
      'status': status,
      'qrCodeData': qrCodeData,
      'studentMatricule': studentMatricule,
      'studentName': studentName,
      'usedAt': usedAt,
    };
  }
}

class Dish {
  final String id;
  final String name;
  final String description;
  final String category;
  final int price;
  final int regularPrice;
  final String mealType;
  final bool isAvailable;
  final String imageUrl;

  Dish({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    required this.price,
    required this.regularPrice,
    required this.mealType,
    this.isAvailable = true,
    required this.imageUrl,
  });
}

class Canteen {
  final String id;
  final String name;
  final String campus;
  final String crowdLevel; // 'faible' | 'moyen' | 'eleve'
  final int waitingTimeMinutes;
  final String location;

  Canteen({
    required this.id,
    required this.name,
    required this.campus,
    required this.crowdLevel,
    required this.waitingTimeMinutes,
    required this.location,
  });
}
