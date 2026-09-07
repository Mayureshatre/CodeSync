import { SignupForm } from '../../../src/components/auth/SignupForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | CodeSync',
  description: 'Create your CodeSync account',
};

export default function SignupPage() {
  return <SignupForm />;
}
