/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	fontFamily: {
  		sans: ['Segoe UI', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Helvetica Neue', 'Arial', 'sans-serif'],
  		mono: ['Segoe UI', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Helvetica Neue', 'Arial', 'sans-serif'],
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			shimmer: {
  				'0%': { transform: 'translateX(-100%)' },
  				'100%': { transform: 'translateX(100%)' }
  			},
  			'liquid-wave': {
  				'0%, 100%': { 
  					transform: 'translateY(0px) scaleY(1)',
  					opacity: '0.3'
  				},
  				'50%': { 
  					transform: 'translateY(-20px) scaleY(1.1)',
  					opacity: '0.5'
  				}
  			},
  			'liquid-wave-reverse': {
  				'0%, 100%': { 
  					transform: 'translateY(0px) scaleX(1)',
  					opacity: '0.3'
  				},
  				'50%': { 
  					transform: 'translateY(20px) scaleX(1.1)',
  					opacity: '0.5'
  				}
  			},
  			'liquid-rotate': {
  				'0%': { 
  					transform: 'rotate(0deg) scale(1)',
  					opacity: '0.5'
  				},
  				'50%': { 
  					transform: 'rotate(180deg) scale(1.2)',
  					opacity: '0.3'
  				},
  				'100%': { 
  					transform: 'rotate(360deg) scale(1)',
  					opacity: '0.5'
  				}
  			},
  			'float': {
  				'0%, 100%': { transform: 'translateY(0px)' },
  				'50%': { transform: 'translateY(-3px)' }
  			},
  			'pulse-flow': {
  				'0%': { 
  					transform: 'translateX(-100%)',
  					opacity: '0'
  				},
  				'50%': { 
  					opacity: '1'
  				},
  				'100%': { 
  					transform: 'translateX(100%)',
  					opacity: '0'
  				}
  			},
  			'pulse-delayed': {
  				'0%, 100%': { opacity: '0.5' },
  				'50%': { opacity: '1' }
  			},
  			'flow-particle-1': {
  				'0%': { 
  					left: '0%',
  					opacity: '0'
  				},
  				'10%': {
  					opacity: '1'
  				},
  				'90%': {
  					opacity: '1'
  				},
  				'100%': { 
  					left: '100%',
  					opacity: '0'
  				}
  			},
  			'flow-particle-2': {
  				'0%': { 
  					left: '0%',
  					opacity: '0'
  				},
  				'15%': {
  					opacity: '0.8'
  				},
  				'85%': {
  					opacity: '0.8'
  				},
  				'100%': { 
  					left: '100%',
  					opacity: '0'
  				}
  			},
  			'flow-particle-3': {
  				'0%': { 
  					left: '0%',
  					opacity: '0'
  				},
  				'20%': {
  					opacity: '0.6'
  				},
  				'80%': {
  					opacity: '0.6'
  				},
  				'100%': { 
  					left: '100%',
  					opacity: '0'
  				}
  			},
  			'flow-dash': {
  				'0%': {
  					strokeDashoffset: '0'
  				},
  				'100%': {
  					strokeDashoffset: '-10'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'pulse-once': 'pulse 0.5s ease-in-out 1',
  			shimmer: 'shimmer 3s ease-in-out infinite',
  			'liquid-wave': 'liquid-wave 4s ease-in-out infinite',
  			'liquid-wave-reverse': 'liquid-wave-reverse 4s ease-in-out infinite 2s',
  			'liquid-rotate': 'liquid-rotate 6s ease-in-out infinite',
  			'float': 'float 2s ease-in-out infinite',
  			'pulse-flow': 'pulse-flow 2s ease-in-out infinite',
  			'pulse-delayed': 'pulse-delayed 2s ease-in-out infinite 1s',
  			'flow-particle-1': 'flow-particle-1 3s ease-in-out infinite',
  			'flow-particle-2': 'flow-particle-2 3s ease-in-out infinite 0.5s',
  			'flow-particle-3': 'flow-particle-3 3s ease-in-out infinite 1s',
  			'flow-dash': 'flow-dash 1s linear infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
