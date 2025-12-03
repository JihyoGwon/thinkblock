/**
 * 공통 스타일 상수
 */

export const COLORS = {
  primary: '#6366f1',
  primaryHover: '#4f46e5',
  success: '#10b981',
  danger: '#dc3545',
  text: {
    primary: '#212529',
    secondary: '#6c757d',
    muted: '#adb5bd',
  },
  border: {
    default: '#e9ecef',
    focus: '#6366f1',
  },
  background: {
    white: '#ffffff',
    gray: {
      50: '#f8f9fa',
      100: '#f1f3f5',
      200: '#e9ecef',
    },
  },
} as const;

export const MODAL_STYLES = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  container: {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: COLORS.background.white,
    borderRadius: '16px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
    zIndex: 1000,
    border: `1px solid ${COLORS.border.default}`,
  },
} as const;

export const BUTTON_STYLES = {
  primary: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '10px',
    backgroundColor: COLORS.primary,
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  secondary: {
    padding: '10px 20px',
    border: `1px solid ${COLORS.border.default}`,
    borderRadius: '10px',
    backgroundColor: COLORS.background.white,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.text.secondary,
    transition: 'all 0.2s',
  },
} as const;

