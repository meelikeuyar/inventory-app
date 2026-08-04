import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token';
import logger from '../utils/logger';

/** Parse refresh token max age from env (e.g. '7d' → ms) */
function getRefreshTokenMaxAge(): number {
  const raw = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const match = raw.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const val = parseInt(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return val * (multipliers[unit] || 86400000);
}

/** Save a new refresh token to user's token list and clean expired ones */
async function saveRefreshToken(userId: string, token: string): Promise<void> {
  const expiresAt = new Date(Date.now() + getRefreshTokenMaxAge());
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: { expiresAt: { $lt: new Date() } } }, // clean expired
  });
  await User.findByIdAndUpdate(userId, {
    $push: { refreshTokens: { token, expiresAt, createdAt: new Date() } },
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, fullName } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      res.status(409).json({ message: 'Bu e-posta adresi zaten kayıtlı' });
      return;
    }

    const user = await User.create({ email, password, fullName });

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });
    await saveRefreshToken(user.id, refreshToken);

    res.status(201).json({
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error('Register error', { error: (error as Error).message });
    res.status(500).json({ message: 'Kayıt sırasında hata oluştu' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ message: 'E-posta veya şifre hatalı' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: 'Hesabınız devre dışı bırakılmış' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'E-posta veya şifre hatalı' });
      return;
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });
    await saveRefreshToken(user.id, refreshToken);

    res.json({
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error('Login error', { error: (error as Error).message });
    res.status(500).json({ message: 'Giriş sırasında hata oluştu' });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ message: 'Refresh token gerekli' });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.userId).select('+refreshTokens');
    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Kullanıcı bulunamadı veya hesap devre dışı' });
      return;
    }

    // ── Token reuse detection ──
    const storedToken = user.refreshTokens.find(t => t.token === refreshToken);
    if (!storedToken) {
      // Possible token theft — revoke ALL tokens for this user
      user.refreshTokens = [];
      await user.save();
      logger.warn('Refresh token reuse detected — all tokens revoked', { userId: user.id });
      res.status(401).json({ message: 'Güvenlik ihlali tespit edildi. Lütfen tekrar giriş yapın.' });
      return;
    }

    // ── Token rotation: remove old, issue new ──
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    const newRefreshToken = generateRefreshToken({ userId: user.id, role: user.role });
    const expiresAt = new Date(Date.now() + getRefreshTokenMaxAge());
    user.refreshTokens.push({ token: newRefreshToken, expiresAt, createdAt: new Date() });

    // Clean expired tokens
    user.refreshTokens = user.refreshTokens.filter(t => t.expiresAt > new Date());
    await user.save();

    const newAccessToken = generateAccessToken({ userId: user.id, role: user.role });
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ message: 'Geçersiz refresh token' });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      // Remove the specific token
      const payload = verifyRefreshToken(refreshToken);
      await User.findByIdAndUpdate(payload.userId, {
        $pull: { refreshTokens: { token: refreshToken } },
      });
    }
    res.json({ message: 'Çıkış yapıldı' });
  } catch {
    // Even if token is invalid, logout succeeds
    res.json({ message: 'Çıkış yapıldı' });
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const user = await User.findById((req as any).userId);
    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }
    res.json({ user });
  } catch {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
}
