import {
  Region as DatabaseRegion,
  TestSessionStatus,
  Tier as DatabaseTier,
  Prisma,
} from "@prisma/client";
import type { RegionCode, TierLabel } from "../domain/tiers.js";
import {
  fromDatabaseTier,
  toDatabaseTier,
} from "../domain/tiers.js";
import { prisma } from "../db/prisma.js";
import { ServiceError } from "./errors.js";

export type OpenTestInput = {
  candidateDiscordId: string;
  candidateUsername: string;
  region: RegionCode;
  previousTier: TierLabel;
  openedByDiscordId: string;
};

export type CompleteTestInput = {
  sessionId: string;
  assignedTier: TierLabel;
  completedByDiscordId: string;
  note?: string;
};

export async function openTestSession(input: OpenTestInput) {
  const session = await prisma.testSession.create({
    data: {
      candidateDiscordId: input.candidateDiscordId,
      candidateUsername: input.candidateUsername,
      region: input.region as DatabaseRegion,
      previousTier: toDatabaseTier(input.previousTier),
      openedByDiscordId: input.openedByDiscordId,
    },
  });

  return {
    id: session.id,
    candidateDiscordId: session.candidateDiscordId,
    candidateUsername: session.candidateUsername,
    region: session.region,
    previousTier: fromDatabaseTier(session.previousTier),
    status: session.status,
    createdAt: session.createdAt,
  };
}

export async function completeTestSession(input: CompleteTestInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      const session = await tx.testSession.findUnique({
        where: { id: input.sessionId },
      });

      if (!session) {
        throw new ServiceError("Test session not found.", 404);
      }
      if (session.status !== TestSessionStatus.OPEN) {
        throw new ServiceError("Test session is no longer open.", 409);
      }

      const updated = await tx.testSession.updateMany({
        where: {
          id: session.id,
          status: TestSessionStatus.OPEN,
        },
        data: {
          status: TestSessionStatus.COMPLETED,
          assignedTier: toDatabaseTier(input.assignedTier),
          completedByDiscordId: input.completedByDiscordId,
          completedAt: new Date(),
          note: input.note,
        },
      });

      if (updated.count !== 1) {
        throw new ServiceError("Test session was completed by another tester.", 409);
      }

      const existing = await tx.player.findUnique({
        where: { discordUserId: session.candidateDiscordId },
      });
      const newTier = toDatabaseTier(input.assignedTier);
      const player = await tx.player.upsert({
        where: { discordUserId: session.candidateDiscordId },
        create: {
          discordUserId: session.candidateDiscordId,
          username: session.candidateUsername,
          region: session.region,
          currentTier: newTier,
        },
        update: {
          username: session.candidateUsername,
          region: session.region,
          currentTier: newTier,
        },
      });

      await tx.tierHistory.create({
        data: {
          playerId: player.id,
          previousTier: existing?.currentTier ?? session.previousTier,
          newTier,
          region: session.region,
          changedByDiscordId: input.completedByDiscordId,
          testSessionId: session.id,
          reason: input.note,
        },
      });

      return {
        sessionId: session.id,
        candidateDiscordId: session.candidateDiscordId,
        candidateUsername: session.candidateUsername,
        region: session.region,
        previousTier: fromDatabaseTier(existing?.currentTier ?? session.previousTier),
        assignedTier: fromDatabaseTier(newTier),
        status: TestSessionStatus.COMPLETED,
        completedByDiscordId: input.completedByDiscordId,
        completedAt: new Date(),
        note: input.note ?? null,
      };
    });
  } catch (error) {
    if (
      error instanceof ServiceError ||
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      throw error;
    }
    throw error;
  }
}

export async function listTestSessions(filters: {
  status?: TestSessionStatus;
  region?: RegionCode;
  limit: number;
}) {
  const sessions = await prisma.testSession.findMany({
    where: {
      status: filters.status,
      region: filters.region as DatabaseRegion | undefined,
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit,
  });

  return sessions.map((session) => ({
    id: session.id,
    candidateDiscordId: session.candidateDiscordId,
    candidateUsername: session.candidateUsername,
    region: session.region,
    previousTier: fromDatabaseTier(session.previousTier),
    assignedTier: session.assignedTier
      ? fromDatabaseTier(session.assignedTier)
      : null,
    status: session.status,
    openedByDiscordId: session.openedByDiscordId,
    completedByDiscordId: session.completedByDiscordId,
    note: session.note,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
  }));
}

export function isSessionStatus(value: string): value is TestSessionStatus {
  return Object.values(TestSessionStatus).includes(value as TestSessionStatus);
}

export function isDatabaseTier(value: string): value is DatabaseTier {
  return Object.values(DatabaseTier).includes(value as DatabaseTier);
}
