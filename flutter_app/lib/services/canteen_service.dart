import 'package:flutter/foundation.dart';
import '../models/models.dart';

class CanteenService extends ChangeNotifier {
  final List<Canteen> _canteens = [
    Canteen(
      id: 'resto-upgc-campus-1',
      name: 'Restaurant Principal (Campus 1)',
      campus: 'Campus 1 • Université Peleforo Gbon Coulibaly',
      crowdLevel: 'faible',
      waitingTimeMinutes: 5,
      location: 'Bâtiment Restauration CROU, Face Amphi A',
    ),
    Canteen(
      id: 'resto-upgc-campus-2',
      name: 'Restaurant Annexe (Campus 2)',
      campus: 'Campus 2 • UPGC Korhogo',
      crowdLevel: 'moyen',
      waitingTimeMinutes: 12,
      location: 'Zone Est, Près des Résidences Universitaires',
    ),
  ];

  late Canteen _selectedCanteen;

  final List<Dish> _dishes = [
    Dish(
      id: 'dish_tchep_poisson',
      name: 'Riz Tchep au Poisson Doré',
      description: 'Riz sénégalais parfumé, légumes mijotés (carotte, chou) et darne de poisson frais assaisonnée.',
      category: 'Spécialité Ivoirienne',
      price: 200,
      regularPrice: 500,
      mealType: 'midi',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop',
    ),
    Dish(
      id: 'dish_sauce_graine',
      name: 'Riz Sauce Graine & Bœuf Tendre',
      description: 'Sauce traditionnelle à base de pulpe de palme, morceaux de viande de bœuf locale et riz blanc parfumé.',
      category: 'Plat Traditionnel',
      price: 200,
      regularPrice: 500,
      mealType: 'midi',
      imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop',
    ),
    Dish(
      id: 'dish_attieke_poisson',
      name: 'Attiéké Garba & Poisson Grillé',
      description: 'Semoule de manioc fraîche de Korhogo, piment rouge concassé, oignon, tomate fraîche et poisson.',
      category: 'Classique Campus',
      price: 200,
      regularPrice: 450,
      mealType: 'soir',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop',
    ),
    Dish(
      id: 'dish_poulet_braise',
      name: 'Riz Blanc & Poulet Rôti Épicé',
      description: 'Cuisse de poulet fermier rôtie au four avec marinade aux épices du Nord et riz brisé.',
      category: 'Repas du Soir',
      price: 200,
      regularPrice: 600,
      mealType: 'soir',
      imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop',
    ),
  ];

  CanteenService() {
    _selectedCanteen = _canteens.first;
  }

  List<Canteen> get canteens => _canteens;
  Canteen get selectedCanteen => _selectedCanteen;
  List<Dish> get dishes => _dishes;

  void selectCanteen(Canteen canteen) {
    _selectedCanteen = canteen;
    notifyListeners();
  }
}
