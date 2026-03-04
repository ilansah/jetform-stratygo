-- Migration: Ajouter la colonne badge_done à la table accreditations
-- Exécuter ce script une seule fois sur la base de données

ALTER TABLE accreditations ADD COLUMN badge_done TINYINT(1) DEFAULT 0;
