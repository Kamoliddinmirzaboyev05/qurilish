-- AlterEnum
ALTER TYPE "ProposalStatus" ADD VALUE 'EXPERT_APPROVED';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'EXPERT';

-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
