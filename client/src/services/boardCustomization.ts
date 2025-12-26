import { BoardCustomization, DEFAULT_CUSTOMIZATION, XoBoardCustomization, DEFAULT_XO_CUSTOMIZATION } from "../types/boardCustomization";
import { getToken } from "../utils/auth";

class BoardCustomizationService {
  private currentCustomization: BoardCustomization = DEFAULT_CUSTOMIZATION;
  private loaded: boolean = false;

  async loadCustomization(): Promise<BoardCustomization> {
    if (this.loaded) {
      return this.currentCustomization;
    }

    const token = getToken();
    if (!token) {
      this.currentCustomization = DEFAULT_CUSTOMIZATION;
      this.loaded = true;
      return this.currentCustomization;
    }

    try {
      const response = await fetch("/api/board-customization", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to load customization");
      }

      const data = await response.json();

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
    const token = getToken();
    if (!token) {
      return false;
    }

    try {
      const response = await fetch("/api/board-customization", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ customization })
      });

      if (!response.ok) {
        throw new Error("Failed to save customization");
      }

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

    const token = getToken();
    if (!token) {
      this.currentCustomization = DEFAULT_XO_CUSTOMIZATION;
      this.loaded = true;
      return this.currentCustomization;
    }

    try {
      const response = await fetch("/api/xo-board-customization", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to load XO customization");
      }

      const data = await response.json();

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
    const token = getToken();
    if (!token) {
      return false;
    }

    try {
      const response = await fetch("/api/xo-board-customization", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ customization })
      });

      if (!response.ok) {
        throw new Error("Failed to save XO customization");
      }

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
