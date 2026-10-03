-- AlterTable
ALTER TABLE "ledger_entries" ADD COLUMN     "attachment_file_id" UUID;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_attachment_file_id_fkey" FOREIGN KEY ("attachment_file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
