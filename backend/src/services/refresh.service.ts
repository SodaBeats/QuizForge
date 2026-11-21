import jwt from 'jsonwebtoken';
import { UserRepository } from '../repository/UserRepository.js';
import { RefreshTokenRepository } from '../repository/RefreshTokenRepository.js';

export const handleAccessTokenGeneration = async (refreshToken: string) => {
  try {
    //verify refresh token
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    //get the refresh token from the database
    const activeRefresh =
      await RefreshTokenRepository.getRefreshToken(refreshToken);

    //validate

    if (
      !activeRefresh ||
      activeRefresh.revoked ||
      activeRefresh.expires_at < new Date()
    ) {
      const error = new Error('Invalid Token');
      (error as any).status = 401;
      throw error;
    }

    //get the owner of the refresh token
    const user = await UserRepository.findRefreshTokenOwner(
      activeRefresh.user_id,
    );

    //check if user exists
    if (!user) {
      const error = new Error('User does not exist');
      (error as any).status = 401;
      throw error;
    }

    //generate new access token
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
        status: user.suspended_at ? 'suspended' : 'active',
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' },
    );
  } catch (error: any) {
    throw error;
  }
};
