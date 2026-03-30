import 'server-only';

import { Prisma } from '@prisma/client';

import prisma from '@/lib/prisma';
import { FitProfileService } from '@/lib/fit/FitProfileService';

export type AccountBookingHistoryItem = {
  id: string;
  serviceType: string;
  status: string;
  startAt: string;
};

export type AccountMtmOrderHistoryItem = {
  id: string;
  orderId: string;
  status: string;
  createdAt: string;
};

export type AccountHistorySummary = {
  bookings: AccountBookingHistoryItem[];
  mtmOrders: AccountMtmOrderHistoryItem[];
};

export const AccountHistoryService = {
  async getCurrentOwnerHistory(limit = 10): Promise<AccountHistorySummary> {
    const owner = await FitProfileService.requireOwnerContext();

    const ownerOr: Prisma.FitProfileWhereInput[] = [];
    if (owner.customerId) {
      ownerOr.push({ customerId: owner.customerId });
    }
    ownerOr.push({ email: owner.email });

    const whereOwner: Prisma.FitProfileWhereInput = {
      OR: ownerOr,
    };

    const [bookings, mtmOrders] = await Promise.all([
      prisma.booking.findMany({
        where: {
          OR: [
            { email: owner.email },
            {
              fitProfile: whereOwner,
            },
          ],
        },
        orderBy: { startAt: 'desc' },
        take: limit,
        select: {
          id: true,
          serviceType: true,
          status: true,
          startAt: true,
        },
      }),
      prisma.productionSpec.findMany({
        where: {
          fitProfile: whereOwner,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          orderId: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      bookings: bookings.map((item) => ({
        id: item.id,
        serviceType: item.serviceType,
        status: item.status,
        startAt: item.startAt.toISOString(),
      })),
      mtmOrders: mtmOrders.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  },
};