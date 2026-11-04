# Security policy

## Supported versions

Security fixes go into the newest release. Please update before reporting, and
check whether the problem is still there.

| Version | Supported |
| --- | --- |
| 0.7.x (latest release) | Yes |
| Anything older | No |

## Reporting a vulnerability

**Do not open a public issue for a security problem.** Use GitHub's private
reporting instead: on the repository's **Security** tab, choose **Report a
vulnerability**. Include what you found, the steps to reproduce it, the version and
platform, and what an attacker could do with it.

You can expect an acknowledgement within a week. We will keep you informed while it
is fixed and credit you in the release notes, unless you would rather not be named.

## What counts

FormSkills fetches skills onto your own machine and can install them into your agents,
so the things that matter most are the ways something outside it could get in:

- **The catalogue**: getting FormSkills to trust a catalogue that was not signed with a
  key it carries, or to fetch a release, pinned or latest, that the signed catalogue
  does not list.
- **Downloads**: anything that gets a skills archive past its SHA-256 check, or unpacks
  it outside its own folder.
- **Reading a skill**: a path or link that reads a file outside the skills folder, or
  skill content that runs as code in the window instead of being shown as text.
- **Installing into agents**: replacing or deleting a folder FormSkills did not make,
  following a symlink, or overwriting a changed install without being told to.
- **Your copies**: anything that writes outside FormSkills' own `edits` folder.

What a skill tells your agent to do once installed is up to that skill and the app
that ships it; report a harmful skill to that app's repository. Bugs that need someone
to already control your machine, or to run a modified build of FormSkills, are
ordinary bugs: please open an issue for those.
