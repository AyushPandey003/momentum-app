import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

interface ContestInvitationEmailProps {
  email: string;
  invitedByUsername: string;
  invitedByEmail: string;
  contestName: string;
  contestDescription?: string;
  startDate: string;
  endDate: string;
  verifyAndJoinUrl: string;
}

const ContestInvitationEmail = (props: ContestInvitationEmailProps) => {
  const {
    email,
    invitedByUsername,
    invitedByEmail,
    contestName,
    contestDescription,
    startDate,
    endDate,
    verifyAndJoinUrl,
  } = props;

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>You&apos;ve been invited to join {contestName}</Preview>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[600px] mx-auto p-[40px]">
            {/* Header */}
            <Section className="text-center mb-[32px]">
              <Heading className="text-[28px] font-bold text-gray-900 m-0 mb-[8px]">
                🏆 Contest Invitation!
              </Heading>
              <Text className="text-[16px] text-gray-600 m-0">
                You&apos;re invited to compete in {contestName}
              </Text>
            </Section>

            {/* Main Content */}
            <Section className="mb-[32px]">
              <Text className="text-[16px] text-gray-700 mb-[16px] m-0">
                Hi there,
              </Text>
              <Text className="text-[16px] text-gray-700 mb-[16px] m-0">
                <strong>{invitedByUsername}</strong> ({invitedByEmail}) has
                invited you to join the contest <strong>{contestName}</strong>{" "}
                on Momentum App.
              </Text>
              {contestDescription && (
                <Text className="text-[16px] text-gray-700 mb-[16px] m-0">
                  {contestDescription}
                </Text>
              )}
              <Text className="text-[16px] text-gray-700 mb-[24px] m-0">
                Click the button below to verify your email and join the
                contest. Start competing with other participants and climb the
                leaderboard!
              </Text>
            </Section>

            {/* Contest Details */}
            <Section className="bg-blue-50 rounded-[8px] p-[20px] mb-[32px]">
              <Text className="text-[14px] font-semibold text-gray-900 mb-[12px] m-0">
                Contest Details:
              </Text>
              <Text className="text-[14px] text-gray-700 mb-[8px] m-0">
                <strong>Contest:</strong> {contestName}
              </Text>
              <Text className="text-[14px] text-gray-700 mb-[8px] m-0">
                <strong>Start Date:</strong> {startDate}
              </Text>
              <Text className="text-[14px] text-gray-700 m-0">
                <strong>End Date:</strong> {endDate}
              </Text>
            </Section>

            {/* CTA Button */}
            <Section className="text-center mb-[32px]">
              <Button
                href={verifyAndJoinUrl}
                className="bg-blue-600 text-white px-[32px] py-[16px] rounded-[8px] text-[16px] font-semibold no-underline box-border inline-block"
              >
                Verify Email & Join Contest
              </Button>
            </Section>

            {/* Alternative Link */}
            <Section className="mb-[32px]">
              <Text className="text-[14px] text-gray-600 mb-[8px] m-0">
                If the button doesn&apos;t work, copy and paste this link into
                your browser:
              </Text>
              <Link
                href={verifyAndJoinUrl}
                className="text-blue-600 text-[14px] break-all"
              >
                {verifyAndJoinUrl}
              </Link>
            </Section>

            {/* Additional Info */}
            <Section className="border-t border-gray-200 pt-[24px] mb-[24px]">
              <Text className="text-[14px] text-gray-600 mb-[8px] m-0">
                <strong>Invited by:</strong> {invitedByUsername} (
                {invitedByEmail})
              </Text>
              <Text className="text-[14px] text-gray-600 m-0">
                <strong>Your email:</strong> {email}
              </Text>
            </Section>

            {/* Footer */}
            <Section className="border-t border-gray-200 pt-[24px]">
              <Text className="text-[12px] text-gray-500 leading-[16px] m-0 mb-[8px]">
                This invitation will expire in 7 days. If you don&apos;t want to
                join this contest, you can safely ignore this email.
              </Text>
              <Text className="text-[12px] text-gray-500 leading-[16px] m-0">
                © {new Date().getFullYear()} Momentum App. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ContestInvitationEmail;
