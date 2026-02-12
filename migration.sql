-- 1. Add 'type' column to distinguish between Fibre and Energie
ALTER TABLE accreditations 
ADD COLUMN type ENUM('Fibre', 'Energie') DEFAULT 'Fibre' AFTER status;

-- 2. Add 'contract_type' column for the new dropdown (VRP, VDI, etc.)
ALTER TABLE accreditations 
ADD COLUMN contract_type VARCHAR(50) AFTER role;

-- 3. Add 'signed_charte_path' for the "Charte de bonne conduite" file
ALTER TABLE accreditations 
ADD COLUMN signed_charte_path VARCHAR(255) AFTER signed_pdf_path;

-- 4. (Optional) Ensure fiber_test_done has a default value (fixes potential bugs)
ALTER TABLE accreditations 
MODIFY COLUMN fiber_test_done BOOLEAN NOT NULL DEFAULT 0;
