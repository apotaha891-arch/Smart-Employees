export const REALISTIC_AVATARS = [
    // Females
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=256&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=256&h=256&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&h=256&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&h=256&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=256&h=256&auto=format&fit=crop",

    // Males
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&h=256&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&h=256&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&h=256&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&h=256&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=256&h=256&auto=format&fit=crop"
];

// Helper to convert old emoji-based avatars or missing avatars into realistic ones deterministically
export const getRealisticAvatar = (avatarValue) => {
    if (!avatarValue) return REALISTIC_AVATARS[0];
    
    // If it's already an image URL, return it
    if (avatarValue.startsWith('http')) return avatarValue;

    // Deterministic selection based on string (so emojis map to fixed photos)
    let hash = 0;
    for (let i = 0; i < avatarValue.length; i++) {
        hash = avatarValue.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % REALISTIC_AVATARS.length;
    return REALISTIC_AVATARS[index];
};
