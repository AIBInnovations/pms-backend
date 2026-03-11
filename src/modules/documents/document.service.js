import Document from './document.model.js';
import { AppError, buildPaginationMeta } from '../../utils/index.js';

class DocumentService {
  async getAll(query = {}) {
    const {
      page = 1, limit = 20, project, category, tag, search,
      sortBy = 'createdAt', sortOrder = 'desc',
    } = query;

    const filter = { project };

    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      Document.find(filter)
        .select('-versions -content')
        .populate('createdBy', 'name')
        .populate('lastEditedBy', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Document.countDocuments(filter),
    ]);

    return { documents, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id) {
    const document = await Document.findById(id)
      .populate('createdBy', 'name')
      .populate('lastEditedBy', 'name')
      .populate('versions.updatedBy', 'name email');

    if (!document) {
      throw new AppError('Document not found', 404, 'NOT_FOUND');
    }
    return document;
  }

  async create(data, userId) {
    const document = await Document.create({
      ...data,
      createdBy: userId,
      lastEditedBy: userId,
    });

    return Document.findById(document._id)
      .populate('createdBy', 'name')
      .populate('lastEditedBy', 'name');
  }

  async update(id, data, userId) {
    const document = await Document.findById(id);
    if (!document) {
      throw new AppError('Document not found', 404, 'NOT_FOUND');
    }

    // Versioning: if content changed, push current content into versions
    if (data.content !== undefined && data.content !== document.content) {
      document.versions.push({
        version: document.version,
        content: document.content,
        updatedBy: document.lastEditedBy || document.createdBy,
        updatedAt: document.updatedAt,
      });
      document.version += 1;
    }

    // Apply updates
    if (data.title !== undefined) document.title = data.title;
    if (data.content !== undefined) document.content = data.content;
    if (data.category !== undefined) document.category = data.category;
    if (data.tags !== undefined) document.tags = data.tags;
    document.lastEditedBy = userId;

    await document.save();

    return Document.findById(id)
      .populate('createdBy', 'name')
      .populate('lastEditedBy', 'name');
  }

  async delete(id) {
    const document = await Document.findByIdAndDelete(id);
    if (!document) {
      throw new AppError('Document not found', 404, 'NOT_FOUND');
    }
    return document;
  }

  async getVersionHistory(id) {
    const document = await Document.findById(id)
      .select('versions version title')
      .populate('versions.updatedBy', 'name email');

    if (!document) {
      throw new AppError('Document not found', 404, 'NOT_FOUND');
    }
    return document;
  }

  async restoreVersion(id, versionNumber, userId) {
    const document = await Document.findById(id);
    if (!document) {
      throw new AppError('Document not found', 404, 'NOT_FOUND');
    }

    const targetVersion = document.versions.find(
      (v) => v.version === versionNumber
    );
    if (!targetVersion) {
      throw new AppError('Version not found', 404, 'NOT_FOUND');
    }

    // Push current content into versions before restoring
    document.versions.push({
      version: document.version,
      content: document.content,
      updatedBy: document.lastEditedBy || document.createdBy,
      updatedAt: document.updatedAt,
    });

    document.content = targetVersion.content;
    document.version += 1;
    document.lastEditedBy = userId;

    await document.save();

    return Document.findById(id)
      .populate('createdBy', 'name')
      .populate('lastEditedBy', 'name')
      .populate('versions.updatedBy', 'name email');
  }
}

export default new DocumentService();
