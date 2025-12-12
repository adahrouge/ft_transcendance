export interface BoardCustomization {
  theme: 'classic' | 'neon' | 'retro' | 'ocean' | 'fire' | 'sunset' | 'custom';
  colors: {
    background: string;
    paddle: string;
    ball: string;
    border: string;
    centerLine: string;
  };
}

export const DEFAULT_CUSTOMIZATION: BoardCustomization = {
  theme: 'classic',
  colors: {
    background: '#0a0a12',
    paddle: '#e0f7ff',
    ball: '#e0f7ff',
    border: '#3d8aa8',
    centerLine: '#2c6b87'
  }
};

export const THEME_PRESETS: Record<string, BoardCustomization> = {
  classic: {
    theme: 'classic',
    colors: {
      background: '#0a0a12',
      paddle: '#e0f7ff',
      ball: '#e0f7ff',
      border: '#3d8aa8',
      centerLine: '#2c6b87'
    }
  },
  neon: {
    theme: 'neon',
    colors: {
      background: '#0d001a',
      paddle: '#ff00ff',
      ball: '#00ffff',
      border: '#ff00ff',
      centerLine: '#00ffff'
    }
  },
  retro: {
    theme: 'retro',
    colors: {
      background: '#0a1e0a',
      paddle: '#00ff00',
      ball: '#00ff00',
      border: '#00ff00',
      centerLine: '#006600'
    }
  },
  ocean: {
    theme: 'ocean',
    colors: {
      background: '#001a33',
      paddle: '#66d9ff',
      ball: '#ffffff',
      border: '#0080ff',
      centerLine: '#004d99'
    }
  },
  fire: {
    theme: 'fire',
    colors: {
      background: '#1a0000',
      paddle: '#ff6600',
      ball: '#ffcc00',
      border: '#ff3300',
      centerLine: '#cc0000'
    }
  },
  sunset: {
    theme: 'sunset',
    colors: {
      background: '#1a0a1f',
      paddle: '#ff6b9d',
      ball: '#ffd93d',
      border: '#ff8c42',
      centerLine: '#c96ddb'
    }
  }
};
