// lib/auth/client-auth.ts
// Client-side auth functions (use localStorage and cookies)

export const ClientAuth = {
  getUserId(): string | null {
    if (typeof window === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    const userCookie = cookies.find(c => c.trim().startsWith('tootfm_user='));
    if (userCookie) {
      return userCookie.split('=')[1];
    }
    return localStorage.getItem('tootfm_user_id');
  },
  
  saveUserId(userId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('tootfm_user_id', userId);
  },
  
  isLoggedIn(): boolean {
    return !!this.getUserId();
  },
  
  logout(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('tootfm_user_id');
    localStorage.removeItem('world_id');
    localStorage.removeItem('user_data');
    document.cookie = 'tootfm_uid=; max-age=0; path=/';
    document.cookie = 'tootfm_user=; max-age=0; path=/';
    window.location.href = '/';
  }
};
