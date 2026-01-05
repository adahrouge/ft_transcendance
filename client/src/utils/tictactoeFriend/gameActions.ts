import { statsService } from "../../services/stats";
import type { Board, Player } from "../../types/tictactoe";
import type { XoBoardCustomization } from "../../types/boardCustomization";

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  board: Board,
  customization: XoBoardCustomization
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = customization.colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = customization.colors.border;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

  ctx.strokeStyle = customization.colors.grid;
  ctx.lineWidth = 4;
  ctx.beginPath();

  ctx.moveTo(canvas.width / 3, 20);
  ctx.lineTo(canvas.width / 3, canvas.height - 20);
  ctx.moveTo(2 * canvas.width / 3, 20);
  ctx.lineTo(2 * canvas.width / 3, canvas.height - 20);

  ctx.moveTo(20, canvas.height / 3);
  ctx.lineTo(canvas.width - 20, canvas.height / 3);
  ctx.moveTo(20, 2 * canvas.height / 3);
  ctx.lineTo(canvas.width - 20, 2 * canvas.height / 3);

  ctx.stroke();

  board.forEach((cell, i) => {
    if (cell) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = col * (canvas.width / 3) + (canvas.width / 6);
      const y = row * (canvas.height / 3) + (canvas.height / 6);
      const size = 40;

      if (cell === 'X') {
        ctx.strokeStyle = customization.colors.xColor;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(x - size, y - size);
        ctx.lineTo(x + size, y + size);
        ctx.moveTo(x + size, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.stroke();
      } else {
        ctx.strokeStyle = customization.colors.oColor;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  });
}

export function getClickedCell(e: MouseEvent, canvas: HTMLCanvasElement): number {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const col = Math.floor((x * scaleX) / (canvas.width / 3));
  const row = Math.floor((y * scaleY) / (canvas.height / 3));
  return row * 3 + col;
}

export async function saveGameStats(winner: Player | 'draw' | null) {
  try {
    await statsService.saveTictactoeFriendMatch(winner);
  } catch {
    // Failed to save stats
  }
}
