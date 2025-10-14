// Supabase Authentication Handler
class AuthHandler {
    constructor() {
        this.supabase = null;
        this.user = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            // Fetch Supabase configuration from server
            const response = await fetch('/api/supabase-config');
            const config = await response.json();

            if (!config.supabaseUrl || !config.supabaseAnonKey) {
                throw new Error('Supabase configuration not available');
            }

            // Initialize Supabase client
            const { createClient } = supabase;
            this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

            // Check for existing session
            const { data: { session } } = await this.supabase.auth.getSession();
            
            if (session) {
                this.user = session.user;
                console.log('User is already logged in:', this.user.email);
            }

            // Listen for auth state changes
            this.supabase.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event);
                
                if (session) {
                    this.user = session.user;
                    console.log('User logged in:', this.user.email);
                    
                    // Store user info in localStorage
                    localStorage.setItem('user', JSON.stringify(this.user));
                    
                    // Redirect to profile if on login page
                    if (window.location.pathname === '/login') {
                        window.location.href = '/profile';
                    }
                } else {
                    this.user = null;
                    localStorage.removeItem('user');
                    console.log('User logged out');
                }
            });

            this.initialized = true;
            console.log('✅ Supabase authentication initialized');
            
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            throw error;
        }
    }

    async signInWithGoogle() {
        if (!this.supabase) {
            console.error('Supabase not initialized');
            return;
        }

        try {
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/profile`
                }
            });

            if (error) throw error;
            
            console.log('Google sign-in initiated');
        } catch (error) {
            console.error('Google sign-in error:', error);
            alert('Failed to sign in with Google: ' + error.message);
        }
    }

    async signInWithLinkedIn() {
        if (!this.supabase) {
            console.error('Supabase not initialized');
            return;
        }

        try {
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: 'linkedin',
                options: {
                    redirectTo: `${window.location.origin}/profile`
                }
            });

            if (error) throw error;
            
            console.log('LinkedIn sign-in initiated');
        } catch (error) {
            console.error('LinkedIn sign-in error:', error);
            alert('Failed to sign in with LinkedIn: ' + error.message);
        }
    }

    async signInWithEmail(email, password) {
        if (!this.supabase) {
            console.error('Supabase not initialized');
            return;
        }

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;
            
            console.log('Email sign-in successful');
            return data;
        } catch (error) {
            console.error('Email sign-in error:', error);
            alert('Failed to sign in: ' + error.message);
            throw error;
        }
    }

    async signOut() {
        if (!this.supabase) {
            console.error('Supabase not initialized');
            return;
        }

        try {
            const { error } = await this.supabase.auth.signOut();
            
            if (error) throw error;
            
            console.log('Sign out successful');
            window.location.href = '/login';
        } catch (error) {
            console.error('Sign out error:', error);
            alert('Failed to sign out: ' + error.message);
        }
    }

    getCurrentUser() {
        return this.user;
    }

    isAuthenticated() {
        return this.user !== null;
    }
}

// Export the auth handler
const authHandler = new AuthHandler();

