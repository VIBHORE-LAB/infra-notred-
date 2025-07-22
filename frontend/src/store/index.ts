import { create } from "zustand";
import { persist } from "zustand/middleware";

type UpdatePlantInfo = Pick<Plant, "firstName" | "lastName" | "avatarUrl">;

export type StoreState = {
  plant: Plant | null;
  signin: (plant: Plant) => void;
  update: (plant: UpdatePlantInfo) => void;
  signout: () => void;
};

const useAuthStore = create<StoreState, [["zustand/persist", StoreState]]>(
  persist(
    (set) => ({
      plant: null,
      signin: (plant: Plant) => set(() => ({ plant })),
      update: (info: UpdatePlantInfo) =>
        set(({ plant }) => ({
          plant: plant ? { ...plant, ...info } : null,
        })),
      signout: () => set(() => ({ plant: null })),
    }),
    { name: "infrarred-user-info" }
  )
);

export { useAuthStore };
