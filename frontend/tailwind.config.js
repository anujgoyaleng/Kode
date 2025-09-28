/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,jsx}'],
	darkMode: 'class',
	theme: { 
		extend: {
			colors: {
				// Light mode colors - keeping blue for light mode
				primary: {
					50: '#eff6ff',
					100: '#dbeafe',
					200: '#bfdbfe',
					300: '#93c5fd',
					400: '#60a5fa',
					500: '#3b82f6',
					600: '#2563eb',
					700: '#1d4ed8',
					800: '#1e40af',
					900: '#1e3a8a',
					950: '#172554',
				},
				// Pure black color scale for dark mode
				black: {
					50: '#ffffff',
					100: '#f5f5f5',
					200: '#e5e5e5',
					300: '#d4d4d4',
					400: '#a3a3a3',
					500: '#737373',
					600: '#525252',
					700: '#404040',
					800: '#262626',
					900: '#171717',
					950: '#000000',
				},
				// Pure black for main backgrounds
				pureblack: '#000000',
				// Modern accent colors for black theme
				accent: {
					50: '#f0f9ff',
					100: '#e0f2fe',
					200: '#bae6fd',
					300: '#7dd3fc',
					400: '#38bdf8',
					500: '#0ea5e9',
					600: '#0284c7',
					700: '#0369a1',
					800: '#075985',
					900: '#0c4a6e',
					950: '#082f49',
				}
			},
			backdropBlur: {
				xs: '2px',
			},
			animation: {
				'fade-in': 'fadeIn 0.5s ease-in-out',
				'slide-in': 'slideIn 0.3s ease-out',
				'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
				'glow': 'glow 2s ease-in-out infinite alternate',
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				slideIn: {
					'0%': { transform: 'translateY(-10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				bounceSubtle: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' },
				},
				glow: {
					'0%': { boxShadow: '0 0 5px rgba(14, 165, 233, 0.2)' },
					'100%': { boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)' },
				}
			}
		}
	},
	plugins: []
}


