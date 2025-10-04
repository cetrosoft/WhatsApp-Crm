/**
 * Invitation Service
 * Handles user invitation creation and email sending
 */

import crypto from 'crypto';
import nodemailer from 'nodemailer';
import supabase from '../config/supabase.js';

/**
 * Create email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Generate secure invitation token
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Create invitation and send email
 */
export const createInvitation = async ({
  organizationId,
  email,
  role = 'member',
  invitedBy,
  organizationName,
}) => {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check for pending invitation
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', email)
      .eq('organization_id', organizationId)
      .is('accepted_at', null)
      .single();

    if (existingInvitation) {
      throw new Error('Invitation already sent to this email');
    }

    // Generate token
    const token = generateToken();

    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        organization_id: organizationId,
        email,
        role,
        token,
        expires_at: expiresAt.toISOString(),
        invited_by: invitedBy,
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create invitation: ' + error.message);
    }

    // Send invitation email
    await sendInvitationEmail({
      email,
      token,
      organizationName,
      role,
    });

    return invitation;
  } catch (error) {
    console.error('Create invitation error:', error);
    throw error;
  }
};

/**
 * Send invitation email
 */
const sendInvitationEmail = async ({ email, token, organizationName, role }) => {
  try {
    const transporter = createTransporter();

    const inviteUrl = `${process.env.FRONTEND_URL}/accept-invitation?token=${token}`;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: `You're invited to join ${organizationName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You're Invited!</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>You've been invited to join <strong>${organizationName}</strong> on the Omnichannel CRM Platform.</p>
              <p><strong>Your Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
              <p>Click the button below to accept the invitation and create your account:</p>
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </div>
              <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="background: #fff; padding: 10px; border-radius: 3px; word-break: break-all; font-size: 12px;">${inviteUrl}</p>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">This invitation will expire in 7 days.</p>
            </div>
            <div class="footer">
              <p>Omnichannel CRM Platform</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        You're Invited!

        You've been invited to join ${organizationName} on the Omnichannel CRM Platform.

        Your Role: ${role}

        Click the link below to accept the invitation and create your account:
        ${inviteUrl}

        This invitation will expire in 7 days.

        If you didn't expect this invitation, you can safely ignore this email.
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Invitation email sent to ${email}`);

  } catch (error) {
    console.error('Send invitation email error:', error);
    // Don't throw error - invitation was created successfully
    // Email failure shouldn't block the process
  }
};

/**
 * Verify invitation token
 */
export const verifyInvitation = async (token) => {
  try {
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('token', token)
      .is('accepted_at', null)
      .single();

    if (error || !invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('Invitation has expired');
    }

    return invitation;
  } catch (error) {
    console.error('Verify invitation error:', error);
    throw error;
  }
};

/**
 * Accept invitation and create user
 */
export const acceptInvitation = async ({ token, password, fullName }) => {
  try {
    // Verify invitation
    const invitation = await verifyInvitation(token);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
    });

    if (authError) {
      throw new Error('Failed to create user: ' + authError.message);
    }

    const userId = authData.user.id;

    // Create user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        organization_id: invitation.organization_id,
        email: invitation.email,
        full_name: fullName || null,
        role: invitation.role,
        permissions: invitation.permissions,
        is_active: true,
        invited_by: invitation.invited_by,
        invitation_accepted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) {
      // Cleanup
      await supabase.auth.admin.deleteUser(userId);
      throw new Error('Failed to create user profile: ' + userError.message);
    }

    // Mark invitation as accepted
    await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    return {
      user,
      organization: invitation.organization,
    };

  } catch (error) {
    console.error('Accept invitation error:', error);
    throw error;
  }
};
