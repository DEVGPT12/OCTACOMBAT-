import { CombatEntity, Difficulty, MoveData } from '../../types/combat';

/**
 * Intelligent CPU Combat Controller
 * Handles distance evaluation, zoning, whiff punishing, mix-ups, and combo chains.
 */
export class CombatAI {
  private difficulty: Difficulty;
  private thinkTimer = 0;
  private reactionDelay = 0;
  private comboChainStep = 0;
  private isCurrentlyBlocking = false;

  constructor(difficulty: Difficulty = 'normal') {
    this.difficulty = difficulty;
  }

  public setDifficulty(diff: Difficulty) {
    this.difficulty = diff;
  }

  public update(
    delta: number,
    aiEntity: CombatEntity,
    playerEntity: CombatEntity,
    triggerAction: (action: string, move?: MoveData) => void
  ) {
    // If AI is in hit-stun, knockdown, or already executing an attack, wait
    if (
      aiEntity.action.startsWith('attack_') ||
      aiEntity.action === 'hit_light' ||
      aiEntity.action === 'hit_heavy' ||
      aiEntity.action === 'knockdown' ||
      aiEntity.action === 'getup' ||
      aiEntity.action === 'victory' ||
      aiEntity.action === 'defeat'
    ) {
      return;
    }

    this.thinkTimer -= delta;
    if (this.thinkTimer > 0) return;

    // Reaction rates by difficulty
    const thinkInterval = this.difficulty === 'hard' ? 0.08 :
                          this.difficulty === 'normal' ? 0.16 : 0.28;
    this.thinkTimer = thinkInterval;

    const dx = playerEntity.position.x - aiEntity.position.x;
    const distance = Math.abs(dx);
    const playerIsAttacking = playerEntity.action.startsWith('attack_');

    // 1. Defensive Guard Reaction
    if (playerIsAttacking && distance < 2.2) {
      const blockChance = this.difficulty === 'hard' ? 0.8 :
                          this.difficulty === 'normal' ? 0.5 : 0.2;
      if (Math.random() < blockChance) {
        triggerAction('block');
        this.isCurrentlyBlocking = true;
        this.thinkTimer = 0.25;
        return;
      }
    } else if (this.isCurrentlyBlocking) {
      this.isCurrentlyBlocking = false;
      triggerAction('idle');
    }

    // 2. High Priority: Special Move Execution when Energy is Full/High
    if (aiEntity.energy >= 50 && distance < 3.2) {
      const specialChance = this.difficulty === 'hard' ? 0.7 :
                            this.difficulty === 'normal' ? 0.4 : 0.2;
      if (Math.random() < specialChance) {
        triggerAction('attack_special');
        return;
      }
    }

    // 3. Close Range Combat (distance < 1.8)
    if (distance < 1.7) {
      const r = Math.random();
      if (this.difficulty === 'hard') {
        // Fast combo string
        if (r < 0.4) {
          triggerAction('attack_light');
        } else if (r < 0.7) {
          triggerAction('attack_kick');
        } else if (r < 0.9) {
          triggerAction('attack_heavy');
        } else {
          triggerAction('block');
        }
      } else if (this.difficulty === 'normal') {
        if (r < 0.4) triggerAction('attack_light');
        else if (r < 0.7) triggerAction('attack_kick');
        else if (r < 0.85) triggerAction('attack_heavy');
        else triggerAction('walk_backward');
      } else {
        // Easy
        if (r < 0.35) triggerAction('attack_light');
        else if (r < 0.6) triggerAction('attack_kick');
        else triggerAction('idle');
      }
      return;
    }

    // 4. Mid-Range Engagement (1.7 <= distance <= 3.5)
    if (distance <= 3.5) {
      const r = Math.random();
      if (r < 0.55) {
        // Close the gap
        triggerAction('walk_forward');
      } else if (r < 0.75) {
        // Jump attack or kick poke
        if (Math.random() < 0.5) {
          triggerAction('jump');
          setTimeout(() => triggerAction('attack_air'), 180);
        } else {
          triggerAction('attack_kick');
        }
      } else {
        triggerAction('idle');
      }
      return;
    }

    // 5. Far Range (distance > 3.5): Approach the player
    triggerAction('walk_forward');
  }
}
