import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Official Institutional Palette - CROU Korhogo / UPGC
  static const Color primary = Color(0xFFEA580C);       // Warm amber-orange
  static const Color primaryDark = Color(0xFFC2410C);   // Deep terra cotta
  static const Color darkBackground = Color(0xFF0F172A);// Slate 900
  static const Color darkSurface = Color(0xFF1E293B);   // Slate 800
  static const Color lightBackground = Color(0xFFF8FAFC);// Neutral light canvas
  static const Color lightSurface = Color(0xFFFFFFFF);  // Pure white card
  static const Color borderLight = Color(0xFFE2E8F0);   // Subtle slate border
  static const Color borderDark = Color(0xFF334155);    // Muted dark border

  static const Color textPrimaryLight = Color(0xFF0F172A);
  static const Color textSecondaryLight = Color(0xFF64748B);
  static const Color textPrimaryDark = Color(0xFFF8FAFC);
  static const Color textSecondaryDark = Color(0xFF94A3B8);

  static const Color success = Color(0xFF10B981); // Emerald 500
  static const Color danger = Color(0xFFEF4444);  // Red 500
  static const Color warning = Color(0xFFF59E0B); // Amber 500

  // Light Theme
  static ThemeData get lightTheme {
    final baseTextTheme = GoogleFonts.plusJakartaSansTextTheme();

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: primary,
      scaffoldBackgroundColor: lightBackground,
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: primaryDark,
        surface: lightSurface,
        error: danger,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: lightSurface,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: false,
        iconTheme: const IconThemeData(color: textPrimaryLight),
        titleTextStyle: GoogleFonts.plusJakartaSans(
          fontSize: 17,
          fontWeight: FontWeight.w700,
          color: textPrimaryLight,
          letterSpacing: -0.3,
        ),
      ),
      cardTheme: CardTheme(
        color: lightSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: borderLight, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF1F5F9),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderLight, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 1.5),
        ),
        labelStyle: GoogleFonts.plusJakartaSans(
          fontSize: 13,
          color: textSecondaryLight,
          fontWeight: FontWeight.w500,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.plusJakartaSans(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.2,
          ),
        ),
      ),
      textTheme: baseTextTheme.copyWith(
        displayLarge: GoogleFonts.plusJakartaSans(
          fontSize: 28,
          fontWeight: FontWeight.w800,
          color: textPrimaryLight,
          letterSpacing: -0.6,
        ),
        headlineMedium: GoogleFonts.plusJakartaSans(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: textPrimaryLight,
          letterSpacing: -0.4,
        ),
        titleMedium: GoogleFonts.plusJakartaSans(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: textPrimaryLight,
        ),
        bodyMedium: GoogleFonts.plusJakartaSans(
          fontSize: 14,
          color: textPrimaryLight,
          height: 1.45,
        ),
        bodySmall: GoogleFonts.plusJakartaSans(
          fontSize: 12,
          color: textSecondaryLight,
        ),
      ),
    );
  }
}
