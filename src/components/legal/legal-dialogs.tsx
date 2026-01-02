"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BilingualSection, LanguageToggle } from "@/components/legal/bilingual-section";
import { formatCurrency } from "@/lib/utils";
import { BRANCH_FEES, MEMBERSHIP_LIMITS, ORGANIZER_FEE } from "@/types/database";

type DialogType = "terms" | "privacy" | null;

interface LegalDialogsProps {
  children: (openDialog: (type: DialogType) => void) => React.ReactNode;
}

export function LegalDialogs({ children }: LegalDialogsProps) {
  const [openDialog, setOpenDialog] = useState<DialogType>(null);

  return (
    <>
      {children(setOpenDialog)}

      {/* Terms of Service Dialog */}
      <Dialog open={openDialog === "terms"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Terms of Service / Mga Tuntunin ng Serbisyo
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Last updated: January 2, 2026</p>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <BilingualSection
              titleEn="1. Acceptance of Terms"
              titleFil="1. Pagtanggap sa mga Tuntunin"
              contentEn={
                <p>
                  By accessing or using Pinoy Paluwagan, you agree to be bound by these Terms of Service.
                  If you do not agree to these terms, please do not use our platform.
                </p>
              }
              contentFil={
                <p>
                  Sa pag-access o paggamit ng Pinoy Paluwagan, sumasang-ayon ka na sumunod sa mga Tuntunin ng Serbisyong ito.
                  Kung hindi ka sumasang-ayon sa mga tuntuning ito, mangyaring huwag gamitin ang aming platform.
                </p>
              }
            />

            <BilingualSection
              titleEn="2. What is Paluwagan?"
              titleFil="2. Ano ang Paluwagan?"
              contentEn={
                <div className="space-y-2">
                  <p>
                    Paluwagan is a traditional Filipino rotating savings system where a group of members contribute
                    a fixed amount on a regular schedule (weekly, biweekly, or monthly). Each cycle, the total
                    contributions are paid out to one member until everyone has received their payout.
                  </p>
                  <p>
                    Pinoy Paluwagan is a digital platform that helps organizers manage their paluwagan groups
                    (called &quot;branches&quot;) with transparency and accountability.
                  </p>
                </div>
              }
              contentFil={
                <div className="space-y-2">
                  <p>
                    Ang Paluwagan ay isang tradisyonal na sistema ng pag-iipon ng mga Pilipino kung saan ang isang grupo
                    ng mga miyembro ay nag-aambag ng nakatakdang halaga sa regular na iskedyul (lingguhan, kada dalawang
                    linggo, o buwanan). Bawat siklo, ang kabuuang kontribusyon ay ibinabayad sa isang miyembro hanggang
                    sa lahat ay nakatanggap ng kanilang payout.
                  </p>
                  <p>
                    Ang Pinoy Paluwagan ay isang digital na platform na tumutulong sa mga organizer na pamahalaan ang
                    kanilang mga grupo ng paluwagan (tinatawag na &quot;branches&quot;) nang may transparency at accountability.
                  </p>
                </div>
              }
            />

            <BilingualSection
              titleEn="3. Member Responsibilities"
              titleFil="3. Mga Responsibilidad ng Miyembro"
              contentEn={
                <ul className="list-disc list-inside space-y-1">
                  <li>Pay your contributions on time according to the branch schedule</li>
                  <li>Provide accurate personal information during registration</li>
                  <li>Keep your account credentials secure</li>
                  <li>Communicate with your organizer if you have payment difficulties</li>
                  <li>Follow the rules set by your branch organizer</li>
                  <li>Do not join branches with the intent to default on payments</li>
                </ul>
              }
              contentFil={
                <ul className="list-disc list-inside space-y-1">
                  <li>Magbayad ng iyong kontribusyon sa tamang oras ayon sa iskedyul ng branch</li>
                  <li>Magbigay ng tama at totoong personal na impormasyon sa pagrehistro</li>
                  <li>Panatilihing ligtas ang iyong account credentials</li>
                  <li>Makipag-usap sa iyong organizer kung may problema ka sa pagbabayad</li>
                  <li>Sundin ang mga panuntunang itinakda ng iyong branch organizer</li>
                  <li>Huwag sumali sa mga branch na may intensyon na hindi magbayad</li>
                </ul>
              }
            />

            <BilingualSection
              titleEn="4. Organizer Responsibilities"
              titleFil="4. Mga Responsibilidad ng Organizer"
              contentEn={
                <ul className="list-disc list-inside space-y-1">
                  <li>Manage your branch fairly and transparently</li>
                  <li>Collect and distribute contributions on schedule</li>
                  <li>Keep accurate records of all payments</li>
                  <li>Communicate clearly with all members about schedules and rules</li>
                  <li>Handle disputes fairly and promptly</li>
                  <li>Verify member identities before accepting them</li>
                  <li>Pay platform fees on time to maintain your branch</li>
                </ul>
              }
              contentFil={
                <ul className="list-disc list-inside space-y-1">
                  <li>Pamahalaan ang iyong branch nang patas at transparent</li>
                  <li>Mangolekta at ipamahagi ang mga kontribusyon sa tamang iskedyul</li>
                  <li>Magtago ng tumpak na rekord ng lahat ng mga bayad</li>
                  <li>Makipag-usap nang malinaw sa lahat ng miyembro tungkol sa iskedyul at mga panuntunan</li>
                  <li>Hawakan ang mga hindi pagkakaunawaan nang patas at mabilis</li>
                  <li>I-verify ang pagkakakilanlan ng miyembro bago sila tanggapin</li>
                  <li>Magbayad ng platform fees sa tamang oras upang mapanatili ang iyong branch</li>
                </ul>
              }
            />

            <BilingualSection
              titleEn="5. Payment Rules"
              titleFil="5. Mga Patakaran sa Pagbabayad"
              contentEn={
                <div className="space-y-2">
                  <p>All payments must be made according to the branch schedule. Late payments may result in:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Being marked as a late payer in the system</li>
                    <li>Frozen membership status</li>
                    <li>Removal from the branch by the organizer</li>
                  </ul>
                  <p className="mt-2">
                    Members who fail to pay after receiving their payout may be reported and banned from the platform.
                  </p>
                </div>
              }
              contentFil={
                <div className="space-y-2">
                  <p>Lahat ng pagbabayad ay dapat gawin ayon sa iskedyul ng branch. Ang mga late na pagbabayad ay maaaring magresulta sa:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Pagkakamarkang late payer sa sistema</li>
                    <li>Frozen na membership status</li>
                    <li>Pag-aalis sa branch ng organizer</li>
                  </ul>
                  <p className="mt-2">
                    Ang mga miyembro na hindi magbayad pagkatapos matanggap ang kanilang payout ay maaaring i-report at i-ban mula sa platform.
                  </p>
                </div>
              }
            />

            <BilingualSection
              titleEn="6. Platform Fees"
              titleFil="6. Mga Bayarin sa Platform"
              contentEn={
                <div className="space-y-2">
                  <p>The following fees apply to organizers:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Setup Fee:</strong> {formatCurrency(BRANCH_FEES.SETUP)} one-time per branch</li>
                    <li><strong>Monthly Fee:</strong> {formatCurrency(BRANCH_FEES.MONTHLY)} per active branch</li>
                  </ul>
                  <p className="mt-2">
                    <strong>Organizer Fee:</strong> Organizers may charge {ORGANIZER_FEE.MIN_PERCENTAGE}% to {ORGANIZER_FEE.MAX_PERCENTAGE}% of the payout amount as their service fee.
                  </p>
                </div>
              }
              contentFil={
                <div className="space-y-2">
                  <p>Ang mga sumusunod na bayarin ay naaangkop sa mga organizer:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Setup Fee:</strong> {formatCurrency(BRANCH_FEES.SETUP)} isang beses kada branch</li>
                    <li><strong>Monthly Fee:</strong> {formatCurrency(BRANCH_FEES.MONTHLY)} kada aktibong branch</li>
                  </ul>
                  <p className="mt-2">
                    <strong>Organizer Fee:</strong> Ang mga organizer ay maaaring mag-charge ng {ORGANIZER_FEE.MIN_PERCENTAGE}% hanggang {ORGANIZER_FEE.MAX_PERCENTAGE}% ng halaga ng payout bilang kanilang service fee.
                  </p>
                </div>
              }
            />

            <BilingualSection
              titleEn="7. Membership Limits"
              titleFil="7. Mga Limitasyon sa Membership"
              contentEn={
                <div className="space-y-2">
                  <p>To ensure responsible participation, members are limited to:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Maximum of <strong>{MEMBERSHIP_LIMITS.MAX_BRANCHES} branches</strong> at any time</li>
                    <li>Maximum monthly contribution of <strong>{formatCurrency(MEMBERSHIP_LIMITS.MAX_MONTHLY_CONTRIBUTION)}</strong> across all branches</li>
                  </ul>
                </div>
              }
              contentFil={
                <div className="space-y-2">
                  <p>Upang matiyak ang responsableng pakikilahok, ang mga miyembro ay limitado sa:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Maximum na <strong>{MEMBERSHIP_LIMITS.MAX_BRANCHES} branches</strong> sa anumang oras</li>
                    <li>Maximum buwanang kontribusyon na <strong>{formatCurrency(MEMBERSHIP_LIMITS.MAX_MONTHLY_CONTRIBUTION)}</strong> sa lahat ng branches</li>
                  </ul>
                </div>
              }
            />

            <BilingualSection
              titleEn="8. Disputes"
              titleFil="8. Mga Hindi Pagkakaunawaan"
              contentEn={
                <p>
                  In case of disputes between members and organizers, we encourage parties to resolve issues directly.
                  Pinoy Paluwagan provides tools for tracking payments and communications, but we are not responsible
                  for mediating disputes or guaranteeing payments.
                </p>
              }
              contentFil={
                <p>
                  Sa kaso ng mga hindi pagkakaunawaan sa pagitan ng mga miyembro at organizer, hinihikayat namin ang
                  mga partido na direktang lutasin ang mga isyu. Nagbibigay ang Pinoy Paluwagan ng mga tool para sa
                  pagsubaybay sa mga bayad at komunikasyon, ngunit hindi kami responsable sa pamamagitan ng mga hindi
                  pagkakaunawaan o paggarantiya ng mga bayad.
                </p>
              }
            />

            <BilingualSection
              titleEn="9. Termination"
              titleFil="9. Pagtatapos"
              contentEn={
                <div className="space-y-2">
                  <p>You may close your account at any time, subject to the following conditions:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>You must complete all pending payment obligations</li>
                    <li>Organizers must ensure all payouts are completed before closing a branch</li>
                    <li>Outstanding disputes must be resolved</li>
                  </ul>
                </div>
              }
              contentFil={
                <div className="space-y-2">
                  <p>Maaari mong isara ang iyong account anumang oras, sa ilalim ng mga sumusunod na kondisyon:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Dapat mong kumpletuhin ang lahat ng pending na obligasyon sa pagbabayad</li>
                    <li>Dapat tiyakin ng mga organizer na lahat ng payout ay nakumpleto bago isara ang branch</li>
                    <li>Ang mga hindi pa nalulutas na hindi pagkakaunawaan ay dapat malutas</li>
                  </ul>
                </div>
              }
            />

            <BilingualSection
              titleEn="10. Limitation of Liability"
              titleFil="10. Limitasyon ng Pananagutan"
              contentEn={
                <div className="space-y-2">
                  <p>
                    Pinoy Paluwagan is a platform that facilitates the organization of paluwagan groups. We do not:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Guarantee any payments between members and organizers</li>
                    <li>Hold or manage any funds on behalf of users</li>
                    <li>Act as a financial institution or lender</li>
                    <li>Provide insurance for any transactions</li>
                  </ul>
                  <p className="mt-2">
                    Users participate at their own risk. We recommend only joining branches with people you know and trust.
                  </p>
                </div>
              }
              contentFil={
                <div className="space-y-2">
                  <p>
                    Ang Pinoy Paluwagan ay isang platform na nagpapadali sa pag-organisa ng mga grupo ng paluwagan. Hindi kami:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Garantiya ng anumang mga bayad sa pagitan ng mga miyembro at organizer</li>
                    <li>Humahawak o namamahala ng anumang pondo sa ngalan ng mga gumagamit</li>
                    <li>Kumikilos bilang isang institusyong pinansyal o nagpapahiram</li>
                    <li>Nagbibigay ng insurance para sa anumang mga transaksyon</li>
                  </ul>
                  <p className="mt-2">
                    Ang mga gumagamit ay nakikilahok sa sarili nilang panganib. Inirerekomenda namin na sumali lamang sa mga branch na may mga taong kilala at pinagkakatiwalaan mo.
                  </p>
                </div>
              }
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={openDialog === "privacy"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Privacy Policy / Patakaran sa Privacy
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Last updated: January 2, 2026</p>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <BilingualSection
              titleEn="1. Information We Collect"
              titleFil="1. Impormasyon na Kinokolekta Namin"
              contentEn={
                <div className="space-y-2">
                  <p>We collect the following information when you use Pinoy Paluwagan:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Account Information:</strong> Email address, phone number, name</li>
                    <li><strong>Profile Information:</strong> Profile photo, ID photo (for verification)</li>
                    <li><strong>Branch Activity:</strong> Contributions, payouts, payment proofs</li>
                    <li><strong>Device Information:</strong> Browser type, IP address, device type</li>
                  </ul>
                </div>
              }
              contentFil={
                <div className="space-y-2">
                  <p>Kinokolekta namin ang mga sumusunod na impormasyon kapag ginagamit mo ang Pinoy Paluwagan:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Impormasyon ng Account:</strong> Email address, numero ng telepono, pangalan</li>
                    <li><strong>Impormasyon ng Profile:</strong> Profile photo, ID photo (para sa verification)</li>
                    <li><strong>Aktibidad sa Branch:</strong> Mga kontribusyon, payout, mga proof ng pagbabayad</li>
                    <li><strong>Impormasyon ng Device:</strong> Uri ng browser, IP address, uri ng device</li>
                  </ul>
                </div>
              }
            />

            <BilingualSection
              titleEn="2. How We Use Your Data"
              titleFil="2. Paano Namin Ginagamit ang Iyong Data"
              contentEn={
                <ul className="list-disc list-inside space-y-1">
                  <li>Create and manage your account</li>
                  <li>Enable you to join and participate in branches</li>
                  <li>Send important notifications about your branches</li>
                  <li>Verify your identity when required</li>
                  <li>Improve our platform and user experience</li>
                  <li>Prevent fraud and abuse</li>
                </ul>
              }
              contentFil={
                <ul className="list-disc list-inside space-y-1">
                  <li>Lumikha at pamahalaan ang iyong account</li>
                  <li>Payagan kang sumali at lumahok sa mga branch</li>
                  <li>Magpadala ng mahahalagang notification tungkol sa iyong mga branch</li>
                  <li>I-verify ang iyong pagkakakilanlan kung kinakailangan</li>
                  <li>Pahusayin ang aming platform at karanasan ng gumagamit</li>
                  <li>Pigilan ang panloloko at pang-aabuso</li>
                </ul>
              }
            />

            <BilingualSection
              titleEn="3. Data Sharing"
              titleFil="3. Pagbabahagi ng Data"
              contentEn={
                <div className="space-y-2">
                  <p>We share your information only in these circumstances:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>With Branch Members:</strong> Your name and profile photo are visible to other members</li>
                    <li><strong>With Organizers:</strong> Organizers can see your contribution status and contact information</li>
                    <li><strong>Service Providers:</strong> Third-party services for hosting, email, and SMS</li>
                    <li><strong>Legal Requirements:</strong> When required by law</li>
                  </ul>
                  <p className="mt-2">
                    We do <strong>not</strong> sell your personal information to third parties.
                  </p>
                </div>
              }
              contentFil={
                <div className="space-y-2">
                  <p>Ibinabahagi lamang namin ang iyong impormasyon sa mga sumusunod na sitwasyon:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Sa mga Branch Member:</strong> Ang iyong pangalan at profile photo ay makikita ng ibang mga miyembro</li>
                    <li><strong>Sa mga Organizer:</strong> Makikita ng mga organizer ang iyong contribution status at contact information</li>
                    <li><strong>Mga Service Provider:</strong> Mga third-party service para sa hosting, email, at SMS</li>
                    <li><strong>Mga Legal na Kinakailangan:</strong> Kapag kinakailangan ng batas</li>
                  </ul>
                  <p className="mt-2">
                    <strong>Hindi</strong> namin ibinebenta ang iyong personal na impormasyon sa mga third party.
                  </p>
                </div>
              }
            />

            <BilingualSection
              titleEn="4. Data Security"
              titleFil="4. Seguridad ng Data"
              contentEn={
                <ul className="list-disc list-inside space-y-1">
                  <li>All data is encrypted in transit using HTTPS/TLS</li>
                  <li>Sensitive data is encrypted at rest in our database</li>
                  <li>We use secure authentication methods</li>
                  <li>Regular security updates and monitoring</li>
                  <li>Limited employee access to personal data</li>
                </ul>
              }
              contentFil={
                <ul className="list-disc list-inside space-y-1">
                  <li>Lahat ng data ay naka-encrypt sa transit gamit ang HTTPS/TLS</li>
                  <li>Ang sensitibong data ay naka-encrypt at rest sa aming database</li>
                  <li>Gumagamit kami ng mga secure na paraan ng authentication</li>
                  <li>Regular na mga security update at monitoring</li>
                  <li>Limitadong access ng mga empleyado sa personal na data</li>
                </ul>
              }
            />

            <BilingualSection
              titleEn="5. Your Rights"
              titleFil="5. Mga Karapatan Mo"
              contentEn={
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                  <li><strong>Export:</strong> Request your data in a portable format</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                </ul>
              }
              contentFil={
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Access:</strong> Humiling ng kopya ng iyong personal na data</li>
                  <li><strong>Pagwawasto:</strong> I-update o itama ang maling impormasyon</li>
                  <li><strong>Pagtanggal:</strong> Humiling ng pagtanggal ng iyong account at data</li>
                  <li><strong>Export:</strong> Humiling ng iyong data sa portable format</li>
                  <li><strong>Opt-out:</strong> Mag-unsubscribe mula sa mga marketing communication</li>
                </ul>
              }
            />

            <BilingualSection
              titleEn="6. Contact Us"
              titleFil="6. Makipag-ugnayan sa Amin"
              contentEn={
                <div className="space-y-1">
                  <p>If you have any questions about this Privacy Policy:</p>
                  <p><strong>Email:</strong> privacy@pinoypaluwagan.com</p>
                </div>
              }
              contentFil={
                <div className="space-y-1">
                  <p>Kung mayroon kang mga katanungan tungkol sa Privacy Policy na ito:</p>
                  <p><strong>Email:</strong> privacy@pinoypaluwagan.com</p>
                </div>
              }
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
