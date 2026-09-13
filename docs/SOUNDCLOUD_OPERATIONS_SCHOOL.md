# 🎓 SoundCloud Operations School

> Teach MEngine what happens after a song is musically ready.

This manual is operational knowledge for SoundCloud integration. It is not permission to publish automatically.
External writes remain governed by the BlackMamba external-write doctrine:

```text
READ → PLAN → VALIDATE → WRITE → READ BACK → COMPARE → CERTIFY
```

## 1. Role of SoundCloud inside MEngine

SoundCloud is a delivery, catalog, audience and reconciliation surface.
It is not the canonical owner of the audio master.

```text
MAMBA MASTER
   ↓
CERTIFICATION
   ↓
PACKAGE
   ↓
PRIVATE CANARY
   ↓
READ BACK
   ↓
VERIFY
   ↓
PUBLICATION DECISION
   ↓
METRICS
   ↓
LEARNING LOOP
```

The canonical WAV remains outside SoundCloud.

## 2. Authentication model

Current SoundCloud API integration uses OAuth 2.1 with PKCE for user-authorized actions.

MEngine must understand two different capability classes:

```text
CLIENT CREDENTIALS
→ public resources only

AUTHORIZATION CODE + PKCE
→ user-scoped operations
→ uploads
→ private resources
→ user actions
```

Rules:

- Never expose client secrets to browser/UI code.
- Access tokens are short-lived and must be treated as ephemeral.
- Refresh tokens are single-use; after refresh, persist the newly returned refresh token atomically.
- Never log access tokens or refresh tokens.
- Token storage and rotation must be isolated from the music catalog.

## 3. Identity preflight

Before any upload:

```text
GET /me
```

Validate that the authenticated account is the intended BlackMamba/SoundCloud identity.

If identity does not match expected configuration:

```text
BLOCK WRITE
```

Do not infer identity from local credentials filenames.

## 4. Track package contract

A track is eligible for SoundCloud only when MEngine can produce a validated package:

```yaml
track_package:
  title: required
  artist: Iyari Gomez
  label: BlackMamba RECORDS
  master_audio: verified-lossless-source
  master_sha256: required
  duration_ms: required
  artwork: optional-or-policy-required
  description: reviewed
  genre: reviewed
  tags: reviewed
  bpm: measured-or-null
  key: measured-with-confidence-or-null
  lyrics_or_instrumental: required-by-blackmamba-policy
  mamba_certification: required
```

Platform metadata must never overwrite canonical metadata automatically.

## 5. Upload semantics

SoundCloud track upload is a multipart request to the tracks endpoint.

Conceptual request:

```text
POST /tracks
Authorization: OAuth <access-token>
Content-Type: multipart/form-data

track[title]
track[artist]
track[asset_data]
```

Important distinction:

```text
UPLOAD FIELD       track[artist]
RESPONSE FIELD     metadata_artist
JSON UPDATE FIELD  metadata_artist
```

Do not send `track[metadata_artist]` during multipart upload.

## 6. Audio immutability warning

The audio asset of an uploaded track cannot simply be replaced through metadata update.

Therefore:

```text
VERIFY MASTER FIRST
↓
UPLOAD ONCE
```

If the wrong audio is uploaded, MEngine must not pretend a metadata update can repair it.
The safe response is to stop, preserve evidence, and follow the replacement/removal policy explicitly.

## 7. Private-canary doctrine

First external write of a new integration path:

```text
ONE TRACK
sharing = private
```

Then:

1. read track back by ID;
2. verify title;
3. verify artist metadata;
4. verify duration tolerance;
5. verify artwork if supplied;
6. verify sharing/privacy state;
7. verify processing/transcoding state when available;
8. store returned stable SoundCloud ID;
9. only then authorize batch behavior.

## 8. Post-upload encoding

A successful upload does not mean immediate playback readiness.
SoundCloud queues uploaded audio for encoding/transcoding.

MEngine should model:

```text
UPLOADED
↓
PROCESSING
↓
PLAYABLE
```

Do not mark a track certified-delivered until read-back confirms the expected state.

## 9. Metadata update school

Metadata updates use the track ID and should change only intended fields.

Conceptually:

```text
PUT /tracks/:id
```

For every metadata write:

```text
before_snapshot
+ requested_patch
+ response_snapshot
+ after_snapshot
```

Then compute a diff.

Unexpected differences stop subsequent writes.

## 10. Artwork workflow

Artwork belongs to the visual pipeline, but SoundCloud delivery receives only an already-approved artifact.

```text
Visual School
↓
approved 1:1 artwork
↓
track package
↓
SoundCloud upload/update
```

SoundCloud is never the image-generation stage.

## 11. Pagination and inventory

Catalog inventory must use pagination deliberately.

MEngine should follow the API's linked pagination rather than assuming the first response contains the entire catalog.

Inventory jobs must preserve:

- request timestamp;
- cursor/next reference;
- page count;
- returned IDs;
- deduplication state;
- last successful checkpoint.

## 12. Access state

Streaming availability is not binary.
MEngine should preserve platform access states such as:

```text
playable
preview
blocked
```

Blocked or non-streamable does not mean nonexistent.

## 13. Rate-limit behavior

If SoundCloud returns throttling/rate-limit responses:

```text
STOP BURST
↓
PRESERVE CHECKPOINT
↓
BACK OFF
↓
RESUME FROM CHECKPOINT
```

Never retry in a tight loop.

## 14. Reconciliation hierarchy

For SoundCloud matching:

```text
SoundCloud stable ID
> verified local mapping
> content/master hash evidence
> ISRC/release evidence when available
> duration + metadata
> title similarity
```

Title alone is never sufficient for a destructive or public action.

## 15. Metrics as learning data

SoundCloud metrics belong to the MEngine learning layer only after identity is confirmed.

Possible learning record:

```yaml
performance_observation:
  track_id: ...
  observation_time: ...
  plays: ...
  likes: ...
  comments: ...
  reposts: ...
  age_days: ...
  mambaspec_hash: ...
  certification_hash: ...
```

Do not interpret raw plays without track age and publication context.

## 16. Failure playbooks

### 401 / auth failure

```text
stop writes
refresh/re-auth path
verify /me
resume only after identity validation
```

### 429 / throttled

```text
checkpoint
backoff
no immediate retry storm
```

### 4xx validation failure

```text
preserve request intent
inspect exact rejected field
repair package
revalidate locally
```

### unexpected response schema

```text
disable writes
capture response safely
update adapter contract
re-test canary
```

### wrong remote metadata

```text
stop batch
read current remote state
calculate explicit patch
write minimum correction
read back
```

## 17. Knowledge boundary

MEngine should know how SoundCloud works before it is allowed to act.

Knowledge can be enabled early.
Write permission can remain disabled.

```yaml
soundcloud:
  knowledge: enabled
  read: enabled
  write: gated
  publish_public: human_approval_required
```

## Final lesson

> SoundCloud is downstream of BlackMamba certification.

> The API is not the producer. It is the delivery surface, evidence source and feedback channel.
