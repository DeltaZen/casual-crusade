import {
  CARD_BORDER,
  CARD_GAP,
  TILE_HEIGHT,
  TILE_WIDTH,
  drawCorners,
} from "./card";
import { Gem, GemColor, gems } from "./gem";
import { font } from "./engine/constants";
import { Draggable } from "./engine/draggable";
import { Vector, offset } from "./engine/vector";
import { Game } from "./game";
import { transformTo } from "./engine/transformer";
import { randomSorter } from "./engine/random";

interface Relic {
  name: string;
  description: string;
  color?: string;
  bg: string;
  repeatable?: boolean;
  pickup: (game: Game) => void;
  gems?: Gem[];
  varies?: boolean;
  offset?: number;
}

export const WILD_NAME = "WILDCARD";
export const HOME_NAME = "HOME";

export const relics: Relic[] = [
  // { name: "BENEVOLENT", description: "Increase your |LIFE| by |1|.", color: "#E93988", bg: "❤", fill: "1", repeatable: true, pickup: (g) => g.boost(1) },
  {
    name: "SAINTHOOD",
    description: "Increase your |LIFE| by |2",
    color: "#E93988",
    bg: "ಎ",
    offset: -3,
    repeatable: true,
    pickup: (g) => g.boost(2),
  },
  // { name: "DEMIDEITY", description: "Increase your |LIFE| by |3", color: "#E93988", bg: "❤", fill: "3", pickup: (g) => g.boost(3) },
  {
    name: "MAGNA CARTA",
    description: "Increase your |MAX HAND SIZE| by |1",
    color: "#00BDE5",
    bg: "ಃ",
    offset: -3,
    repeatable: true,
    pickup: (g) => g.handSize++,
  },
  {
    name: "SACRAMENT",
    description: "Increases the presented |reward options",
    color: "#F89F00",
    bg: "ಐ",
    offset: -2,
    repeatable: true,
    pickup: (g) => g.rewardOptions++,
  },
  {
    name: "MIRACLE",
    description: "Allows you to pick an |extra| reward",
    color: "#F89F00",
    bg: "ಠ",
    pickup: (g) => g.rewardPicks++,
  },
  {
    name: "CAVALRY",
    description: "Your |empty cards| can open chests",
    color: "#B4D000",
    bg: "ು",
    offset: -3,
    pickup: (g) => (g.canRemoteOpen = true),
  },
  {
    name: "FAITH",
    description: "Stepping on |RED| also |HEALS",
    color: "#E93988",
    bg: "ಏ",
    offset: -2,
    pickup: (g) => (g.healOnStep = true),
  },
  {
    name: "PILLAGE",
    description: "Double your step |SCORE",
    color: "#F3DC00",
    bg: "ಚ",
    offset: -1,
    repeatable: true,
    pickup: (g) => g.stepScore++,
  },
  {
    name: "LOOT",
    description: "Passing by |ORANGE| activates it",
    color: "#F89F00",
    bg: "್",
    pickup: (g) => (g.remoteMulti = true),
  },
  {
    name: "MANNA",
    description: "Get increased |GEM| chance",
    color: "#F3DC00",
    bg: "ಞ",
    offset: -3,
    repeatable: true,
    pickup: (g) => (g.gemChance *= 1.3),
  },
  {
    name: "SIN",
    description: "Once per level, |redraw| your hand if |stuck",
    color: "#846AC1",
    bg: "೪",
    pickup: (g) => (g.canRedraw = true),
  },
  {
    name: WILD_NAME,
    description: "|!1| ⇆ |!2|",
    bg: "ೞ",
    repeatable: true,
    varies: true,
    offset: -3,
    pickup: (g) => {},
  },
  {
    name: HOME_NAME,
    description: "Freely revisit |!1| tiles",
    bg: "ಹ",
    repeatable: true,
    varies: true,
    pickup: (g) => {},
  },
];

export class RelicIcon extends Draggable {
  public icon: boolean;

  constructor(
    x: number,
    y: number,
    private game: Game,
    public data: Relic,
  ) {
    super(x, y, TILE_WIDTH, TILE_HEIGHT);
    this.selectable = true;
    this.locked = true;
    this.data.gems = gems.map((g) => ({ ...g })).sort(randomSorter);
    this.data.color = this.data.varies
      ? this.data.gems[0].color
      : this.data.color;
  }

  public isInside(point: Vector): boolean {
    if (!this.icon) return super.isInside(point);

    const c = this.getCenter();
    return (
      point.x > c.x - this.s.x * 0.25 * this.scale.x &&
      point.x < c.x + this.s.x * 0.25 * this.scale.x &&
      point.y > c.y - this.s.y * 0.25 * this.scale.y &&
      point.y < c.y + this.s.y * 0.25 * this.scale.y
    );
  }

  public move(to: Vector, duration: number): void {
    this.tween.move(to, duration);
  }

  public makeSelectable(): void {}

  public getMoveTarget(): Vector {
    return { x: 30, y: 50 };
  }

  protected hover(): void {
    setTimeout(() => {
      const dx = this.icon ? 230 : 0;
      const dy = this.icon ? 120 : -50 * this.scale.y;
      const tt = this.data.description
        .replace("!1", this.data.gems[0].name)
        .replace("!2", this.data.gems[1].name);
      this.game.tooltip.show(
        this.data.name,
        tt,
        offset(this.getCenter(), dx, dy),
        this.data.name == WILD_NAME
          ? this.data.gems.map((g) => g.color)
          : [this.data.color],
        this.icon,
      );
    }, 5);
    this.game.audio.thud();
  }

  public exit(): void {
    this.game.tooltip.visible = false;
  }

  protected pick(): void {}

  protected click(): void {
    this.game.audio.pop();
    this.game.audio.swoosh();
    this.game.addRelic(this);
    this.game.tooltip.visible = false;
    this.data.pickup(this.game);
  }

  protected drop(): void {}

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const c = this.getCenter();
    transformTo(ctx, c.x, c.y, 0, this.scale.x, this.scale.y);
    if (this.hovered && this.selectable && !this.icon) {
      ctx.translate(0, -10);
    }

    if (!this.icon) {
      ctx.fillStyle = "#000";
      ctx.fillRect(
        this.p.x,
        this.p.y + CARD_GAP,
        this.s.x - CARD_GAP * 2,
        this.s.y - CARD_GAP * 2,
      );
      ctx.fillStyle = this.hovered ? "#ffff66" : "#ddd";
      ctx.fillRect(
        this.p.x + CARD_BORDER + CARD_GAP,
        this.p.y + CARD_BORDER + CARD_GAP,
        this.s.x - CARD_BORDER * 2 - CARD_GAP * 2,
        this.s.y - CARD_BORDER * 2 - CARD_GAP * 2,
      );

      ctx.strokeStyle = "#00000022";
      drawCorners(ctx, this.p.x, this.p.y);
    }

    ctx.font = `30px sans-serif`;
    ctx.textAlign = "center";

    const off = this.data.offset ?? 0;
    // ctx.fillStyle = "#000";
    // ctx.fillText(this.data.bg, c.x + 2 + 15 - 15, c.y + 2 + 12 + off);
    ctx.fillStyle = this.data.color;
    if (this.data.name == WILD_NAME) {
      const c = this.getCenter();
      const gradient = ctx.createLinearGradient(c.x - 20, 0, c.x + 20, 0);
      gradient.addColorStop(0, this.data.gems[0].color);
      gradient.addColorStop(0.49, this.data.gems[0].color);
      gradient.addColorStop(0.51, this.data.gems[1].color);
      gradient.addColorStop(1, this.data.gems[1].color);
      ctx.fillStyle = gradient;
    }
    ctx.strokeStyle = "#000000cc";
    ctx.lineWidth = 6;
    ctx.strokeText(this.data.bg, c.x + 15 - 15, c.y + 12 + off);
    ctx.fillText(this.data.bg, c.x + 15 - 15, c.y + 12 + off);

    ctx.restore();
  }
}
