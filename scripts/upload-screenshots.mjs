import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const RECRUITER_EMAIL = process.env.E2E_RECRUITER_EMAIL || "adriennedeveloper@gmail.com";
const RECRUITER_PASSWORD = (process.env.E2E_RECRUITER_PASSWORD || "123456").trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log("Signing in with recruiter account...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: RECRUITER_EMAIL,
    password: RECRUITER_PASSWORD,
  });

  if (authError) {
    console.error("Auth error:", authError);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log("Logged in as user:", userId);

  const screenshots = [
    {
      localPath: "C:\\Users\\adrie\\.gemini\\antigravity-ide\\brain\\6b901e28-748e-4227-af49-247f92635dc5\\clean_screening_and_no_online_dot_1789648439015.png",
      remoteName: `clean-screening-no-online-dot-${Date.now()}.png`,
    },
    {
      localPath: "C:\\Users\\adrie\\.gemini\\antigravity-ide\\brain\\6b901e28-748e-4227-af49-247f92635dc5\\interview_demote_warning_modal_1789649987611.png",
      remoteName: `interview-demote-warning-modal-${Date.now()}.png`,
    },
    {
      localPath: "C:\\Users\\adrie\\.gemini\\antigravity-ide\\brain\\6b901e28-748e-4227-af49-247f92635dc5\\candidate_demoted_to_screening_success_1789650026860.png",
      remoteName: `candidate-demoted-to-screening-${Date.now()}.png`,
    },
  ];

  const results = {};

  for (const item of screenshots) {
    if (!fs.existsSync(item.localPath)) {
      console.error(`File not found: ${item.localPath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(item.localPath);
    const storagePath = `notion-reports/${userId}/${item.remoteName}`;

    console.log(`Uploading ${item.remoteName} to profile-media...`);
    const { error: uploadError } = await supabase.storage
      .from("profile-media")
      .upload(storagePath, fileBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error(`Upload error for ${item.remoteName}:`, uploadError);
      continue;
    }

    const { data: publicUrlData } = supabase.storage
      .from("profile-media")
      .getPublicUrl(storagePath);

    console.log(`Uploaded! Public URL: ${publicUrlData.publicUrl}`);
    results[item.remoteName] = publicUrlData.publicUrl;
  }

  console.log("\n--- UPLOAD SUMMARY ---");
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
