import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { profileAPI } from '../../api';

// SVG Icons for social platforms
const SocialIcons: Record<string, React.ReactNode> = {
  twitter: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  discord: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
  spotify: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  ),
  twitch: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
    </svg>
  ),
  reddit: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>
  ),
  pinterest: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
    </svg>
  ),
  snapchat: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301a.603.603 0 0 1 .274-.074c.12 0 .24.03.345.09a.643.643 0 0 1 .3.54c0 .36-.18.63-.444.765a3.07 3.07 0 0 1-.675.315 3.12 3.12 0 0 0-.449.18.533.533 0 0 0-.255.405c0 .15.06.285.15.405.18.225.42.435.66.615 1.02.794 2.34 1.829 2.025 3.36-.12.615-.48 1.095-.96 1.365-.45.255-1.02.39-1.695.405a7.158 7.158 0 0 1-1.095-.084c-.3-.045-.6-.075-.885-.075a3.49 3.49 0 0 0-.495.045 1.61 1.61 0 0 0-.525.195c-.24.12-.42.285-.615.51a5.79 5.79 0 0 1-.54.585 3.53 3.53 0 0 1-2.355.87c-.87 0-1.68-.3-2.34-.855a5.356 5.356 0 0 1-.555-.6c-.195-.225-.375-.39-.615-.51a1.67 1.67 0 0 0-.54-.195 4.04 4.04 0 0 0-.465-.045c-.3 0-.6.03-.885.075a6.914 6.914 0 0 1-1.095.084c-.69-.015-1.26-.15-1.71-.405-.48-.27-.84-.75-.96-1.365-.315-1.53 1.005-2.565 2.025-3.36.24-.18.48-.39.66-.615a.567.567 0 0 0 .15-.405.532.532 0 0 0-.254-.405 3.12 3.12 0 0 0-.45-.18 3.07 3.07 0 0 1-.675-.315c-.27-.135-.45-.405-.45-.765 0-.24.105-.45.3-.54.105-.06.225-.09.345-.09.09 0 .18.015.27.074.374.181.733.286 1.035.286h.027c.18 0 .3-.03.39-.075l-.015-.27-.003-.045c-.106-1.588-.238-3.569.283-4.74C7.872 1.07 11.229.794 12.221.794h-.015z"/>
    </svg>
  ),
  default: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
};

// Platform detection from URL
const detectPlatformFromUrl = (url: string): { platform: string; color: string } => {
  const urlLower = url.toLowerCase();
  
  const platformPatterns: { pattern: RegExp; platform: string; color: string }[] = [
    { pattern: /twitter\.com|x\.com/i, platform: 'x', color: '#000000' },
    { pattern: /instagram\.com/i, platform: 'instagram', color: '#E1306C' },
    { pattern: /github\.com/i, platform: 'github', color: '#333333' },
    { pattern: /linkedin\.com/i, platform: 'linkedin', color: '#0077B5' },
    { pattern: /youtube\.com|youtu\.be/i, platform: 'youtube', color: '#FF0000' },
    { pattern: /discord\.com|discord\.gg/i, platform: 'discord', color: '#5865F2' },
    { pattern: /t\.me|telegram\./i, platform: 'telegram', color: '#26A5E4' },
    { pattern: /wa\.me|whatsapp\.com/i, platform: 'whatsapp', color: '#25D366' },
    { pattern: /facebook\.com|fb\.com/i, platform: 'facebook', color: '#1877F2' },
    { pattern: /tiktok\.com/i, platform: 'tiktok', color: '#000000' },
    { pattern: /spotify\.com/i, platform: 'spotify', color: '#1DB954' },
    { pattern: /twitch\.tv/i, platform: 'twitch', color: '#9146FF' },
    { pattern: /reddit\.com/i, platform: 'reddit', color: '#FF4500' },
    { pattern: /pinterest\.com/i, platform: 'pinterest', color: '#E60023' },
    { pattern: /snapchat\.com/i, platform: 'snapchat', color: '#FFFC00' },
  ];
  
  for (const { pattern, platform, color } of platformPatterns) {
    if (pattern.test(urlLower)) {
      return { platform, color };
    }
  }
  
  return { platform: 'default', color: 'var(--accent-secondary)' };
};

// Get favicon URL for unknown platforms
const getFaviconUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
  } catch {
    return '';
  }
};

// Social Link Icon Component
const SocialLinkIcon: React.FC<{ url: string; size?: number }> = ({ url, size = 20 }) => {
  const { platform } = detectPlatformFromUrl(url);
  const icon = SocialIcons[platform];
  
  if (icon && platform !== 'default') {
    return <>{icon}</>;
  }
  
  // Try to get favicon for unknown platforms
  const faviconUrl = getFaviconUrl(url);
  if (faviconUrl) {
    return (
      <img 
        src={faviconUrl} 
        alt="" 
        width={size} 
        height={size}
        style={{ borderRadius: 4 }}
        onError={(e) => {
          // If favicon fails to load, replace with default icon
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  
  return <>{SocialIcons.default}</>;
};

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    avatar: '',
    socialLinks: {
      twitter: '',
      instagram: '',
      github: '',
      linkedin: '',
      youtube: '',
      discord: ''
    },
    customLinks: [] as { title: string; url: string; isActive: boolean }[]
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.profile.displayName || user.username,
        bio: user.profile.bio || '',
        location: user.profile.location || '',
        website: user.profile.website || '',
        avatar: user.profile.avatar || '',
        socialLinks: {
          twitter: user.profile.socialLinks?.twitter || '',
          instagram: user.profile.socialLinks?.instagram || '',
          github: user.profile.socialLinks?.github || '',
          linkedin: user.profile.socialLinks?.linkedin || '',
          youtube: user.profile.socialLinks?.youtube || '',
          discord: user.profile.socialLinks?.discord || ''
        },
        customLinks: user.profile.customLinks || []
      });
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData(prev => ({ ...prev, avatar: base64 }));
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        alert('Failed to read image file');
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload image:', error);
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await profileAPI.update(formData);
      if (user) {
        updateUser({
          ...user,
          profile: {
            ...user.profile,
            displayName: formData.displayName,
            bio: formData.bio,
            location: formData.location,
            website: formData.website,
            avatar: formData.avatar,
            socialLinks: formData.socialLinks,
            customLinks: formData.customLinks
          }
        });
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const shareProfile = (platform: string) => {
    const profileUrl = `${window.location.origin}/u/${user?.username}`;
    const text = `Check out my profile! ${profileUrl}`;
    
    const links: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=Check out my profile!`,
      email: `mailto:?subject=My Profile&body=${encodeURIComponent(text)}`,
    };

    window.open(links[platform], '_blank');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const addCustomLink = () => {
    setFormData(prev => ({
      ...prev,
      customLinks: [...prev.customLinks, { title: '', url: '', isActive: true }]
    }));
  };

  const removeCustomLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customLinks: prev.customLinks.filter((_, i) => i !== index)
    }));
  };

  const updateCustomLink = (index: number, field: 'title' | 'url', value: string) => {
    setFormData(prev => ({
      ...prev,
      customLinks: prev.customLinks.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };
  
  // Social Platform Config for Cards - with real SVG icons
  const socialPlatforms = [
    { key: 'twitter', label: 'X (Twitter)', color: '#000000', baseUrl: 'https://x.com/' },
    { key: 'instagram', label: 'Instagram', color: '#E1306C', baseUrl: 'https://instagram.com/' },
    { key: 'github', label: 'GitHub', color: '#333333', baseUrl: 'https://github.com/' },
    { key: 'linkedin', label: 'LinkedIn', color: '#0077B5', baseUrl: 'https://linkedin.com/in/' },
    { key: 'youtube', label: 'YouTube', color: '#FF0000', baseUrl: 'https://youtube.com/@' },
    { key: 'discord', label: 'Discord', color: '#5865F2', baseUrl: '' },
  ] as const;

  if (!user) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-description">Customize your social card and share it with the world</p>
      </div>

      <div className="profile-page-grid">
        {/* Profile Card Preview */}
        <div>
          <h3 style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
            Preview
          </h3>
          <div className="profile-card">
            <div className="profile-cover" />
            <div className="profile-content">
              <div className="profile-header-row">
                <div className="profile-avatar-container">
                  <div 
                    className="profile-avatar"
                    style={{ cursor: 'default' }}
                  >
                    {formData.avatar ? (
                      <img src={formData.avatar} alt={formData.displayName} />
                    ) : (
                      getInitials(formData.displayName || user.username)
                    )}
                    {isUploadingImage && (
                      <div className="avatar-upload-overlay" style={{ opacity: 1 }}>
                        <div className="spinner" style={{ width: 24, height: 24 }} />
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      className="avatar-edit-btn"
                      onClick={() => fileInputRef.current?.click()}
                      title="Edit profile picture"
                      type="button"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>
                <div className="profile-info">
                  <h2 className="profile-name">{formData.displayName || user.username}</h2>
                  <p className="profile-username">@{user.username}</p>
                </div>
              </div>
              {formData.bio && <p className="profile-bio">{formData.bio}</p>}
              <div className="profile-meta">
                {formData.location && (
                  <span>📍 {formData.location}</span>
                )}
                {formData.website && (
                  <a href={formData.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                    🔗 Website
                  </a>
                )}
              </div>
              {/* Enhanced Social Trays/Cards with Real SVG Icons */}
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {socialPlatforms.map(platform => {
                  const username = formData.socialLinks[platform.key as keyof typeof formData.socialLinks];
                  if (!username) return null;
                  
                  // Map platform key to icon key
                  const iconKey = platform.key === 'twitter' ? 'x' : platform.key;
                  
                  return (
                    <a
                      key={platform.key}
                      href={platform.key === 'discord' ? '#' : `${platform.baseUrl}${username}`}
                      target={platform.key === 'discord' ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className="social-card-tray"
                      onClick={(e) => {
                        if (platform.key === 'discord') {
                          e.preventDefault();
                          navigator.clipboard.writeText(username);
                          alert('Discord username copied to clipboard!');
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--bg-elevated)',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        border: '1px solid var(--border-subtle)',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: '12px', 
                          background: platform.color, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: platform.key === 'github' ? 'white' : 'white',
                        }}>
                          {SocialIcons[iconKey] || SocialIcons.default}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{platform.label}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>@{username}</div>
                        </div>
                      </div>
                      <div style={{ 
                        background: platform.color, 
                        color: 'white', 
                        padding: '6px 16px', 
                        borderRadius: '20px', 
                        fontSize: 12, 
                        fontWeight: 600 
                      }}>
                        {platform.key === 'discord' ? 'Copy' : 'Follow'}
                      </div>
                    </a>
                  );
                })}

                {/* Custom Links Cards with Auto-detected Platform Icons */}
                {formData.customLinks.map((link, index) => {
                  const { platform, color } = detectPlatformFromUrl(link.url);
                  
                  return (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--bg-elevated)',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        border: '1px solid var(--border-subtle)',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: '12px', 
                          background: color, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'white',
                        }}>
                          <SocialLinkIcon url={link.url} />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{link.title}</div>
                      </div>
                      <div style={{ 
                        background: platform !== 'default' ? color : 'var(--bg-card)', 
                        border: platform === 'default' ? '1px solid var(--border-medium)' : 'none',
                        color: platform !== 'default' ? 'white' : 'var(--text-primary)', 
                        padding: '6px 16px', 
                        borderRadius: '20px', 
                        fontSize: 12, 
                        fontWeight: 600 
                      }}>
                        Visit
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Share Profile */}
          <div className="card" style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>Share Profile</h4>
            <div className="share-buttons">
              <button className="share-btn whatsapp" onClick={() => shareProfile('whatsapp')} title="WhatsApp">
                {SocialIcons.whatsapp}
              </button>
              <button className="share-btn twitter" onClick={() => shareProfile('twitter')} title="X (Twitter)">
                {SocialIcons.x}
              </button>
              <button className="share-btn facebook" onClick={() => shareProfile('facebook')} title="Facebook">
                {SocialIcons.facebook}
              </button>
              <button className="share-btn telegram" onClick={() => shareProfile('telegram')} title="Telegram">
                {SocialIcons.telegram}
              </button>
              <button className="share-btn email" onClick={() => shareProfile('email')} title="Email">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </button>
            </div>
          </div>

          {/* User Stats */}
          <div className="card" style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>Your Stats</h4>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="stat-card">
                <div className="stat-value">{user.stats.pdfCompressed}</div>
                <div className="stat-label">PDFs</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{user.stats.imagesConverted}</div>
                <div className="stat-label">Images</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{user.stats.notesCreated}</div>
                <div className="stat-label">Notes</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{user.stats.cgpaCalculations}</div>
                <div className="stat-label">CGPA Calcs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Edit Profile</h3>
            {isEditing && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
            {!isEditing && (
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                Edit
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gap: 20 }}>
            <div className="input-group">
              <label className="input-label">Display Name</label>
              <input
                type="text"
                className="input"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Bio</label>
              <textarea
                className="input"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                placeholder="Tell us about yourself"
                rows={3}
                maxLength={300}
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {formData.bio.length}/300
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Location</label>
                <input
                  type="text"
                  className="input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={!isEditing}
                  placeholder="City, Country"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Website</label>
                <input
                  type="url"
                  className="input"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  disabled={!isEditing}
                  placeholder="https://yoursite.com"
                />
              </div>
            </div>

            {isEditing && (
              <div style={{ 
                padding: '12px 16px', 
                background: 'rgba(139, 92, 246, 0.1)', 
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Click the pencil icon on the avatar to upload a new profile picture
                </span>
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }} />

            <h4 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Social Links</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">X (Twitter)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, twitter: e.target.value } })}
                  disabled={!isEditing}
                  placeholder="username"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Instagram</label>
                <input
                  type="text"
                  className="input"
                  value={formData.socialLinks.instagram}
                  onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, instagram: e.target.value } })}
                  disabled={!isEditing}
                  placeholder="username"
                />
              </div>
              <div className="input-group">
                <label className="input-label">GitHub</label>
                <input
                  type="text"
                  className="input"
                  value={formData.socialLinks.github}
                  onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, github: e.target.value } })}
                  disabled={!isEditing}
                  placeholder="username"
                />
              </div>
              <div className="input-group">
                <label className="input-label">LinkedIn</label>
                <input
                  type="text"
                  className="input"
                  value={formData.socialLinks.linkedin}
                  onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, linkedin: e.target.value } })}
                  disabled={!isEditing}
                  placeholder="username"
                />
              </div>
              <div className="input-group">
                <label className="input-label">YouTube</label>
                <input
                  type="text"
                  className="input"
                  value={formData.socialLinks.youtube}
                  onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, youtube: e.target.value } })}
                  disabled={!isEditing}
                  placeholder="channel"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Discord</label>
                <input
                  type="text"
                  className="input"
                  value={formData.socialLinks.discord}
                  onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, discord: e.target.value } })}
                  disabled={!isEditing}
                  placeholder="username"
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>Custom Links</h4>
              {isEditing && (
                <button className="btn btn-secondary btn-sm" onClick={addCustomLink}>
                  + Add Link
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {formData.customLinks.map((link, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    className="input"
                    value={link.title}
                    onChange={(e) => updateCustomLink(index, 'title', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Title (e.g. Portfolio)"
                  />
                  <input
                    type="text"
                    className="input"
                    value={link.url}
                    onChange={(e) => updateCustomLink(index, 'url', e.target.value)}
                    disabled={!isEditing}
                    placeholder="URL (https://...)"
                  />
                  {isEditing && (
                    <button className="btn btn-ghost" style={{ color: 'var(--error)' }} onClick={() => removeCustomLink(index)}>
                      ×
                    </button>
                  )}
                </div>
              ))}
              {formData.customLinks.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No custom links added yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
