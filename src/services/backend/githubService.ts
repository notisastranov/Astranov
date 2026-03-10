import { Firestore } from '@google-cloud/firestore';
import { RepoSyncRequest, PatchArtifact } from '../../types/operational';
import { AuditLogService } from './operatorService';

const firestore = new Firestore();

export class RepoSyncRequestService {
  private static collection = firestore.collection('repo_sync_requests');

  static async create(actorId: string, actorRole: string, branch: string, commitMessage: string, files: string[]) {
    const request: RepoSyncRequest = {
      id: this.collection.doc().id,
      actorId,
      actorRole,
      createdAt: Date.now(),
      status: 'pending',
      branch,
      commitMessage,
      files
    };
    await this.collection.doc(request.id).set(request);
    await AuditLogService.log(actorId, 'REPO_SYNC_REQUEST_CREATED', 'success', { branch, commitMessage }, request.id);
    return request;
  }

  static async approve(requestId: string, operatorId: string) {
    await this.collection.doc(requestId).update({ status: 'approved' });
    await AuditLogService.log(operatorId, 'REPO_SYNC_REQUEST_APPROVED', 'success', { requestId }, requestId);
  }

  static async getStatus(requestId: string) {
    const doc = await this.collection.doc(requestId).get();
    return doc.data() as RepoSyncRequest;
  }

  static async updateStatus(requestId: string, status: RepoSyncRequest['status'], result?: string, errorMessage?: string) {
    await this.collection.doc(requestId).update({ status, result, errorMessage });
  }
}

export class PatchArtifactService {
  private static collection = firestore.collection('patch_artifacts');

  static async create(actorId: string, description: string, targetFiles: string[], patchContent: string) {
    const artifact: PatchArtifact = {
      id: this.collection.doc().id,
      createdAt: Date.now(),
      actorId,
      description,
      targetFiles,
      patchContent,
      status: 'draft'
    };
    await this.collection.doc(artifact.id).set(artifact);
    return artifact;
  }

  static async getLatest(actorId?: string) {
    let query = this.collection.orderBy('createdAt', 'desc').limit(1);
    if (actorId) {
      query = query.where('actorId', '==', actorId);
    }
    const snapshot = await query.get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as PatchArtifact;
  }
}

export class GitHubBridgeService {
  private static getGitHubConfig() {
    // Ensure this is only executed in a server-side environment
    if (typeof window !== 'undefined') {
      throw new Error('GitHub configuration can only be accessed in server-side runtime');
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) {
      throw new Error('GitHub configuration missing (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)');
    }

    return { token, owner, repo };
  }

  static async executeRepoSyncRequest(requestId: string, operatorId: string) {
    const { token, owner, repo } = this.getGitHubConfig();
    
    const request = await RepoSyncRequestService.getStatus(requestId);

    if (!request || request.status !== 'approved') {
      throw new Error('Request not found or not approved');
    }

    await RepoSyncRequestService.updateStatus(requestId, 'executing');

    try {
      // GitHub API Flow:
      // a. Get the latest commit SHA of the branch
      const branchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${request.branch}`, {
        headers: { 'Authorization': `token ${token}` }
      });
      
      if (!branchRes.ok) {
        throw new Error(`Failed to get branch ref: ${branchRes.statusText}`);
      }
      
      const branchData = await branchRes.json();
      const baseSha = branchData.object.sha;

      // b. Create blobs for each file
      // In this implementation, we assume the 'files' in the request are paths, 
      // and we need to get the content. For the "latest update" flow, 
      // we'll use the latest patch artifact content if available.
      
      const latestPatch = await PatchArtifactService.getLatest(request.actorId);
      if (!latestPatch) {
        throw new Error('No patch artifacts found to sync');
      }

      // Create blob for the patch content (simplified: one blob for the whole patch or per file)
      // For this demo, we'll treat the patch as a single file update or multiple if targetFiles is provided.
      // If targetFiles has multiple, we'd ideally split the patch, but for now we'll assume 1:1 or use the first file.
      
      const treeItems = await Promise.all(latestPatch.targetFiles.map(async (filePath) => {
        const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
          method: 'POST',
          headers: { 
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: latestPatch.patchContent,
            encoding: 'utf-8'
          })
        });
        const blobData = await blobRes.json();
        return {
          path: filePath,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha
        };
      }));

      // c. Create a new tree
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
        method: 'POST',
        headers: { 
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          base_tree: baseSha,
          tree: treeItems
        })
      });
      const treeData = await treeRes.json();

      // d. Create a commit
      const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
        method: 'POST',
        headers: { 
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: request.commitMessage,
          tree: treeData.sha,
          parents: [baseSha]
        })
      });
      const commitData = await commitRes.json();

      // e. Update the reference
      const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${request.branch}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sha: commitData.sha,
          force: false
        })
      });

      if (!refRes.ok) {
        throw new Error(`GitHub API error updating ref: ${refRes.statusText}`);
      }

      await RepoSyncRequestService.updateStatus(requestId, 'completed', `Commit created: ${commitData.sha}`);
      await AuditLogService.log(operatorId, 'REPO_SYNC_EXECUTED', 'success', { requestId, commitSha: commitData.sha }, requestId);

      return commitData.sha;
    } catch (error: any) {
      console.error('GitHub Sync Error:', error);
      await RepoSyncRequestService.updateStatus(requestId, 'failed', undefined, error.message);
      await AuditLogService.log(operatorId, 'REPO_SYNC_EXECUTED', 'failure', { requestId, error: error.message }, requestId);
      throw error;
    }
  }
}
