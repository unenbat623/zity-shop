import { create } from 'zustand';
import { UserProfile, DeliveryAddress } from '../types';

interface AuthState {
  user: UserProfile;
  selectedAddressIndex: number;
  addAddress: (address: DeliveryAddress) => void;
  setSelectedAddressIndex: (index: number) => void;
  toggleZityChefConnection: () => void;
  addPoints: (amount: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    name: 'Цэлмүүн',
    email: 'tselmuun@zity.mn',
    phone: '99112233',
    zityPoints: 450,
    isZityChefConnected: true,
    addresses: [
      {
        district: 'Сүхбаатар дүүрэг',
        khoroo: '1-р хороо',
        streetBuilding: 'Zity Center, 4-р давхар',
        entranceAppt: '1-р орц, 402 тоот',
        phone: '99112233',
        notes: 'Үүдэнд утасдаж мэдэгдэнэ үү',
      },
      {
        district: 'Хан-Уул дүүрэг',
        khoroo: '11-р хороо',
        streetBuilding: 'Зайсан Сүлд хотхон 102-р байр',
        entranceAppt: '3-р орц, 54 тоот',
        phone: '99112233',
        notes: 'Код: 1234',
      },
    ],
  },
  selectedAddressIndex: 0,

  addAddress: (address) =>
    set((state) => ({
      user: {
        ...state.user,
        addresses: [...state.user.addresses, address],
      },
    })),

  setSelectedAddressIndex: (index) => set({ selectedAddressIndex: index }),

  toggleZityChefConnection: () =>
    set((state) => ({
      user: {
        ...state.user,
        isZityChefConnected: !state.user.isZityChefConnected,
      },
    })),

  addPoints: (amount) =>
    set((state) => ({
      user: {
        ...state.user,
        zityPoints: state.user.zityPoints + amount,
      },
    })),
}));
