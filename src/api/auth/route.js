// app/api/auth/route.js
import { NextResponse } from 'next/server';
import { verifyInitData } from '@utils/telegramAuth';
import { generateToken } from '@/utils/tokenAuth';
import { saveUser } from '@/utils/user';

export async function POST(request) {
  try {
    // Log the entire request for debugging
    const body = await request.json();
    console.log('Received request body:', body);

    const { initData } = body;

    if (!initData) {
      console.error('No initData provided');
      return NextResponse.json(
        { error: 'No initialization data provided' },
        { status: 400 }
      );
    }

    // Verify the initData
    const userData = await verifyInitData(initData);
    console.log('Verification result:', userData);

    if (!userData) {
      return NextResponse.json(
        { error: 'Invalid initialization data' },
        { status: 401 }
      );
    }

    // Save user data
    try {
      await saveUser(userData);
      console.log('User saved successfully');
    } catch (error) {
      console.error('Error saving user:', error);
      return NextResponse.json(
        { error: 'Failed to save user data' },
        { status: 500 }
      );
    }

    // Generate token
    const token = generateToken(userData);
    console.log('Token generated successfully');

    // Create response
    const response = NextResponse.json({
      success: true,
      userData,
      token // Include token in development
    }, { status: 200 });

    // Set cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed to 'lax' for testing
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}