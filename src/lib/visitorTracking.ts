// Visitor tracking utilities using cookies and localStorage
export interface VisitorSession {
  id: string;
  createdAt: string;
  viewedPosts: Set<string>;
  viewedPromotions: Set<string>;
  lastActivity: string;
}

class VisitorTracker {
  private session: VisitorSession | null = null;
  private readonly SESSION_KEY = 'nf_visitor_session';
  private readonly SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.initializeSession();
  }

  private generateVisitorId(): string {
    return `visitor_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private initializeSession(): void {
    try {
      // Try to get existing session from localStorage
      const stored = localStorage.getItem(this.SESSION_KEY);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        const lastActivity = new Date(parsed.lastActivity);
        const now = new Date();
        
        // Check if session is still valid (within 30 minutes)
        if (now.getTime() - lastActivity.getTime() < this.SESSION_DURATION) {
          this.session = {
            ...parsed,
            viewedPosts: new Set(parsed.viewedPosts || []),
            viewedPromotions: new Set(parsed.viewedPromotions || [])
          };
          
          // Update last activity
          this.updateLastActivity();
          return;
        }
      }
      
      // Create new session
      this.createNewSession();
    } catch (error) {
      console.error('Error initializing visitor session:', error);
      this.createNewSession();
    }
  }

  private createNewSession(): void {
    this.session = {
      id: this.generateVisitorId(),
      createdAt: new Date().toISOString(),
      viewedPosts: new Set(),
      viewedPromotions: new Set(),
      lastActivity: new Date().toISOString()
    };
    
    this.saveSession();
  }

  private saveSession(): void {
    if (!this.session) return;
    
    try {
      const sessionData = {
        ...this.session,
        viewedPosts: Array.from(this.session.viewedPosts),
        viewedPromotions: Array.from(this.session.viewedPromotions)
      };
      
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error saving visitor session:', error);
    }
  }

  private updateLastActivity(): void {
    if (this.session) {
      this.session.lastActivity = new Date().toISOString();
      this.saveSession();
    }
  }

  public getVisitorId(): string {
    return this.session?.id || 'anonymous';
  }

  public hasViewedPost(postId: string): boolean {
    return this.session?.viewedPosts.has(postId) || false;
  }

  public markPostAsViewed(postId: string): boolean {
    if (!this.session) return false;
    
    const wasAlreadyViewed = this.session.viewedPosts.has(postId);
    
    if (!wasAlreadyViewed) {
      this.session.viewedPosts.add(postId);
      this.updateLastActivity();
      console.log(`📊 Post ${postId} marked as viewed by visitor ${this.session.id}`);
    }
    
    return !wasAlreadyViewed; // Return true if this is a new view
  }

  public hasViewedPromotion(promotionId: string): boolean {
    return this.session?.viewedPromotions.has(promotionId) || false;
  }

  public markPromotionAsViewed(promotionId: string): boolean {
    if (!this.session) return false;
    
    const wasAlreadyViewed = this.session.viewedPromotions.has(promotionId);
    
    if (!wasAlreadyViewed) {
      this.session.viewedPromotions.add(promotionId);
      this.updateLastActivity();
      console.log(`📊 Promotion ${promotionId} marked as viewed by visitor ${this.session.id}`);
    }
    
    return !wasAlreadyViewed; // Return true if this is a new view
  }

  public getSessionInfo(): VisitorSession | null {
    return this.session;
  }

  public clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      this.createNewSession();
    } catch (error) {
      console.error('Error clearing visitor session:', error);
    }
  }

  // Get visitor fingerprint for additional tracking
  public getVisitorFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Visitor fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Create a simple hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
}

// Create singleton instance
export const visitorTracker = new VisitorTracker();

// Cookie utilities for additional tracking
export const CookieUtils = {
  set: (name: string, value: string, days: number = 30): void => {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    } catch (error) {
      console.error('Error setting cookie:', error);
    }
  },

  get: (name: string): string | null => {
    try {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    } catch (error) {
      console.error('Error getting cookie:', error);
      return null;
    }
  },

  delete: (name: string): void => {
    try {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    } catch (error) {
      console.error('Error deleting cookie:', error);
    }
  }
};

// Initialize visitor tracking on page load
if (typeof window !== 'undefined') {
  // Set visitor cookie if not exists
  const existingVisitorId = CookieUtils.get('nf_visitor_id');
  if (!existingVisitorId) {
    CookieUtils.set('nf_visitor_id', visitorTracker.getVisitorId(), 365); // 1 year
  }
  
  console.log('🔍 Visitor tracking initialized:', {
    visitorId: visitorTracker.getVisitorId(),
    fingerprint: visitorTracker.getVisitorFingerprint(),
    session: visitorTracker.getSessionInfo()
  });
}