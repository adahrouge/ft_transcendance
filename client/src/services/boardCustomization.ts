import { BoardCustomization, DEFAULT_CUSTOMIZATION, XoBoardCustomization, DEFAULT_XO_CUSTOMIZATION } from "../types/boardCustomization";
import { apiRequest } from "../api";

class BoardCustomizationService {
  private currentCustomization: BoardCustomization = DEFAULT_CUSTOMIZATION;
  private loaded: boolean = false;

  async loadCustomization(): Promise<BoardCustomization> {
    if (this.loaded) {
      return this.currentCustomization;
    }

    try {
      const data = await apiRequest<{ customization: BoardCustomization | null }>("/api/board-customization");

      if (data.customization) {
        this.currentCustomization = data.customization;
      } else {
        this.currentCustomization = DEFAULT_CUSTOMIZATION;
      }

      this.loaded = true;
      return this.currentCustomization;
    } catch {
      this.currentCustomization = DEFAULT_CUSTOMIZATION;
      this.loaded = true;
      return this.currentCustomization;
    }
  }

  async saveCustomization(customization: BoardCustomization): Promise<boolean> {
    try {
      await apiRequest("/api/board-customization", {
        method: "PUT",
        body: JSON.stringify({ customization })
      });

      this.currentCustomization = customization;
      return true;
    } catch {
      return false;
    }
  }

  getCurrentCustomization(): BoardCustomization {
    return this.currentCustomization;
  }

  setCurrentCustomization(customization: BoardCustomization): void {
    this.currentCustomization = customization;
  }

  resetToDefault(): void {
    this.currentCustomization = DEFAULT_CUSTOMIZATION;
  }
}

export const boardCustomizationService = new BoardCustomizationService();

// XO Board Customization Service
class XoBoardCustomizationService {
  private currentCustomization: XoBoardCustomization = DEFAULT_XO_CUSTOMIZATION;
  private loaded: boolean = false;

  async loadCustomization(): Promise<XoBoardCustomization> {
    if (this.loaded) {
      return this.currentCustomization;
    }

    try {
      const data = await apiRequest<{ customization: XoBoardCustomization | null }>("/api/xo-board-customization");

      if (data.customization) {
        this.currentCustomization = data.customization;
      } else {
        this.currentCustomization = DEFAULT_XO_CUSTOMIZATION;
      }

      this.loaded = true;
      return this.currentCustomization;
    } catch {
      this.currentCustomization = DEFAULT_XO_CUSTOMIZATION;
      this.loaded = true;
      return this.currentCustomization;
    }
  }

  async saveCustomization(customization: XoBoardCustomization): Promise<boolean> {
    try {
      await apiRequest("/api/xo-board-customization", {
        method: "PUT",
        body: JSON.stringify({ customization })
      });

      this.currentCustomization = customization;
      return true;
    } catch {
      return false;
    }
  }

  getCurrentCustomization(): XoBoardCustomization {
    return this.currentCustomization;
  }

  setCurrentCustomization(customization: XoBoardCustomization): void {
    this.currentCustomization = customization;
  }

  resetToDefault(): void {
    this.currentCustomization = DEFAULT_XO_CUSTOMIZATION;
  }
}

export const xoBoardCustomizationService = new XoBoardCustomizationService();
