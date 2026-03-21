import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, Image, Pressable, Platform, StatusBar,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { signOut } from '@firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { auth } from '../../services/firebase';
import { Role } from '../../types';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const isDark = theme === 'dark';
  const c = isDark ? colors.dark : colors.light;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfileMenuOpen(false);
      router.replace('/login');
    } catch (e) { console.error(e); }
  };

  const navItems = [
    { label: 'Songs', path: '/songs' },
    { label: 'Albums', path: '/albums' },
    { label: 'Artists', path: '/artists' },
    { label: 'Curators', path: '/curators' },
  ];

  const footerCol1 = [
    { label: 'About', path: '/about' },
    { label: 'Help', path: '/help' },
    { label: 'Contact Us', path: '/legal/contact' },
  ];
  const footerCol2 = [
    { label: 'Terms', path: '/legal/terms' },
    { label: 'Privacy', path: '/legal/privacy' },
    { label: 'Refunds', path: '/legal/refunds' },
    { label: 'Shipping', path: '/legal/shipping' },
  ];

  const avatarUrl = userProfile?.photoURL
    || `https://ui-avatars.com/api/?name=${userProfile?.displayName || userProfile?.email}&background=random`;

  return (
    <>
      <View style={[styles.header, { backgroundColor: c.bg, borderBottomColor: c.border }]}>
        <View style={styles.inner}>

          {/* Left — hamburger */}
          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.iconBtn}>
            <MaterialIcons name="menu" size={24} color={c.icon} />
          </TouchableOpacity>

          {/* Center — logo */}
          <TouchableOpacity onPress={() => router.push('/')}>
            <Text style={[styles.logo, { color: c.accent }]}>Acapella</Text>
          </TouchableOpacity>

          {/* Right — search + theme + avatar/login */}
          <View style={styles.rightRow}>
            <TouchableOpacity onPress={() => router.push('/search')} style={styles.iconBtn}>
              <MaterialIcons name="search" size={24} color={c.icon} />
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
              <MaterialIcons name={isDark ? 'wb-sunny' : 'nights-stay'} size={24} color={c.icon} />
            </TouchableOpacity>

            {currentUser && userProfile ? (
              <TouchableOpacity onPress={() => setProfileMenuOpen(true)} style={styles.avatarBtn}>
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => router.push('/login')}
                style={[styles.loginBtn, { backgroundColor: c.accent }]}
              >
                <Text style={styles.loginText}>Log In</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* ── Drawer ── */}
      <Modal visible={drawerOpen} animationType="slide" transparent onRequestClose={() => setDrawerOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setDrawerOpen(false)} />
        <View style={[styles.drawer, { backgroundColor: c.bg }]}>
          <View style={[styles.drawerHeader, { borderBottomColor: c.border }]}>
            <Text style={[styles.logo, { color: c.accent }]}>Acapella</Text>
            <TouchableOpacity onPress={() => setDrawerOpen(false)}>
              <MaterialIcons name="close" size={24} color={c.icon} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.drawerNav}>
            {navItems.map(({ label, path }) => (
              <TouchableOpacity
                key={path}
                onPress={() => { router.push(path as any); setDrawerOpen(false); }}
                style={[styles.drawerNavItem, pathname === path && { backgroundColor: c.activeBg }]}
              >
                <Text style={[styles.drawerNavText, { color: c.text }, pathname === path && { color: c.accentAlt }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={[styles.drawerFooter, { borderTopColor: c.border, backgroundColor: c.footerBg }]}>
            <Text style={[styles.drawerFooterHeading, { color: c.accent }]}>Explore & Support</Text>
            <View style={styles.drawerFooterCols}>
              <View style={styles.drawerFooterCol}>
                {footerCol1.map(({ label, path }) => (
                  <TouchableOpacity key={path} onPress={() => { router.push(path as any); setDrawerOpen(false); }}>
                    <Text style={[styles.drawerFooterLink, { color: c.muted }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.drawerFooterCol}>
                {footerCol2.map(({ label, path }) => (
                  <TouchableOpacity key={path} onPress={() => { router.push(path as any); setDrawerOpen(false); }}>
                    <Text style={[styles.drawerFooterLink, { color: c.muted }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Text style={[styles.drawerFooterCopy, { color: c.muted }]}>
              © {new Date().getFullYear()} Acapella.
            </Text>
          </View>
        </View>
      </Modal>

      {/* ── Profile Dropdown Modal ── */}
      {currentUser && userProfile && (
        <Modal visible={profileMenuOpen} animationType="fade" transparent onRequestClose={() => setProfileMenuOpen(false)}>
          <Pressable style={styles.overlay} onPress={() => setProfileMenuOpen(false)} />
          <View style={[styles.profileMenu, { backgroundColor: c.menuBg }]}>
            <View style={[styles.profileMenuHeader, { borderBottomColor: c.border }]}>
              <Text style={[styles.profileMenuSub, { color: c.muted }]}>Signed in as</Text>
              <Text style={[styles.profileMenuName, { color: c.text }]} numberOfLines={1}>
                {userProfile.displayName || userProfile.email}
              </Text>
            </View>

            {[
              { label: 'Profile', icon: 'person', path: `/${userProfile.username}` },
              { label: 'Settings', icon: 'settings', path: '/settings' },
            ].map(({ label, icon, path }) => (
              <TouchableOpacity key={path} style={styles.profileMenuItem}
                onPress={() => { router.push(path as any); setProfileMenuOpen(false); }}>
                <MaterialIcons name={icon as any} size={16} color={c.icon} style={styles.menuIcon} />
                <Text style={[styles.profileMenuItemText, { color: c.text }]}>{label}</Text>
              </TouchableOpacity>
            ))}

            {!userProfile.isCurator && (
              <TouchableOpacity style={styles.profileMenuItem}
                onPress={() => { router.push('/(protected)/curator-program'); setProfileMenuOpen(false); }}>
                <MaterialIcons name="auto-awesome" size={16} color="#ca8a04" style={styles.menuIcon} />
                <Text style={[styles.profileMenuItemText, { color: '#ca8a04' }]}>Become a Curator</Text>
              </TouchableOpacity>
            )}

            <View style={[styles.profileMenuDivider, { borderTopColor: c.border }]} />
            <TouchableOpacity style={styles.profileMenuItem} onPress={handleLogout}>
              <MaterialIcons name="logout" size={16} color="#ef4444" style={styles.menuIcon} />
              <Text style={[styles.profileMenuItemText, { color: '#ef4444' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </>
  );
};

const STATUS_BAR_H = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44;

const colors = {
  light: {
    bg: '#ffffff', border: 'rgba(99,71,155,0.2)', icon: '#374151',
    text: '#111827', muted: '#6b7280', accent: '#63479b', accentAlt: '#63479b',
    activeBg: '#f3f4f6', menuBg: '#ffffff', footerBg: '#f9fafb',
  },
  dark: {
    bg: '#0f0f0f', border: 'rgba(99,71,155,0.2)', icon: '#d1d5db',
    text: '#f9fafb', muted: '#9ca3af', accent: '#a78bdf', accentAlt: '#a78bdf',
    activeBg: '#1f2937', menuBg: '#1f2937', footerBg: 'rgba(0,0,0,0.2)',
  },
};

const styles = StyleSheet.create({
  header: {
    paddingTop: STATUS_BAR_H,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 4,
    borderBottomWidth: 1, zIndex: 50,
  },
  inner: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', height: 64, paddingHorizontal: 16,
  },
  logo: { fontSize: 22, fontWeight: '700', fontFamily: 'serif' },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 8, borderRadius: 999 },
  avatarBtn: { padding: 4 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  loginBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  loginText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 40 },

  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    width: '80%', maxWidth: 320, zIndex: 50,
    shadowColor: '#000', shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 16,
  },
  drawerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, marginTop: STATUS_BAR_H,
  },
  drawerNav: { flex: 1, paddingHorizontal: 8, paddingTop: 16 },
  drawerNavItem: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginBottom: 4 },
  drawerNavText: { fontSize: 16, fontWeight: '500' },
  drawerFooter: { padding: 24, borderTopWidth: 1 },
  drawerFooterHeading: { fontWeight: '700', fontFamily: 'serif', fontSize: 15, marginBottom: 12 },
  drawerFooterCols: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  drawerFooterCol: { flex: 1, gap: 4 },
  drawerFooterLink: { fontSize: 13, paddingVertical: 4 },
  drawerFooterCopy: { fontSize: 11, textAlign: 'center' },

  profileMenu: {
    position: 'absolute', top: STATUS_BAR_H + 64 + 8, right: 12,
    width: 224, borderRadius: 8, zIndex: 60,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 12,
  },
  profileMenuHeader: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  profileMenuSub: { fontSize: 12 },
  profileMenuName: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  profileMenuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  profileMenuItemText: { fontSize: 14 },
  menuIcon: { marginRight: 12 },
  profileMenuDivider: { borderTopWidth: 1, marginVertical: 4 },
});

export default Header;