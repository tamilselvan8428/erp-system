import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class QueryChain {
  constructor(promise) {
    this.promise = promise;
  }

  sort(sortObj) {
    this.promise = this.promise.then(items => {
      const key = Object.keys(sortObj)[0];
      const dir = sortObj[key];
      const sorted = [...items];
      sorted.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];
        if (valA === undefined) return 1;
        if (valB === undefined) return -1;
        if (typeof valA === 'string') {
          return (dir === -1 || dir === 'desc') ? valB.localeCompare(valA) : valA.localeCompare(valB);
        }
        return (dir === -1 || dir === 'desc') ? valB - valA : valA - valB;
      });
      return sorted;
    });
    return this;
  }

  populate() {
    return this;
  }

  select() {
    return this;
  }

  limit(n) {
    this.promise = this.promise.then(items => items.slice(0, n));
    return this;
  }

  then(resolve, reject) {
    return this.promise.then(resolve, reject);
  }
}

class MockModel {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name.toLowerCase()}s.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  _read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      return [];
    }
  }

  _write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  _match(item, query) {
    if (!query) return true;
    for (const key in query) {
      const val = query[key];
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        if (key === '$or') {
          if (!Array.isArray(val)) return false;
          return val.some(q => this._match(item, q));
        }
        const operators = Object.keys(val);
        for (const op of operators) {
          const opVal = val[op];
          if (op === '$in') {
            if (!Array.isArray(opVal)) continue;
            const itemVal = item[key];
            if (Array.isArray(itemVal)) {
              if (!itemVal.some(v => opVal.includes(v))) return false;
            } else {
              if (!opVal.includes(itemVal)) return false;
            }
          } else if (op === '$gte') {
            if (item[key] < opVal) return false;
          } else if (op === '$lte') {
            if (item[key] > opVal) return false;
          } else if (op === '$gt') {
            if (item[key] <= opVal) return false;
          } else if (op === '$lt') {
            if (item[key] >= opVal) return false;
          } else if (op === '$ne') {
            if (item[key] === opVal) return false;
          }
        }
      } else {
        if (item[key] !== val) return false;
      }
    }
    return true;
  }
}

export function getModel(modelName) {
  const mockModelInstance = new MockModel(modelName);

  const ModelClass = class {
    constructor(data) {
      Object.assign(this, data);
      if (!this._id) {
        this._id = uuidv4();
      }
      if (!this.createdAt) {
        this.createdAt = new Date().toISOString();
      }
      this.updatedAt = new Date().toISOString();
    }

    async save() {
      this.updatedAt = new Date().toISOString();
      const items = mockModelInstance._read();
      const idx = items.findIndex(item => item._id === this._id);
      
      const cleanData = JSON.parse(JSON.stringify(this));

      if (idx >= 0) {
        items[idx] = cleanData;
      } else {
        items.push(cleanData);
      }
      mockModelInstance._write(items);
      return this;
    }
  };

  ModelClass.find = (query = {}) => {
    return new QueryChain(
      Promise.resolve(mockModelInstance._read().filter(item => mockModelInstance._match(item, query)))
    );
  };

  ModelClass.findOne = async (query = {}) => {
    const items = mockModelInstance._read();
    const item = items.find(item => mockModelInstance._match(item, query));
    return item ? new ModelClass(item) : null;
  };

  ModelClass.findById = async (id) => {
    const items = mockModelInstance._read();
    const item = items.find(item => item._id === id);
    return item ? new ModelClass(item) : null;
  };

  ModelClass.create = async (data) => {
    if (Array.isArray(data)) {
      const createdItems = [];
      for (const d of data) {
        const inst = new ModelClass(d);
        await inst.save();
        createdItems.push(inst);
      }
      return createdItems;
    } else {
      const inst = new ModelClass(data);
      await inst.save();
      return inst;
    }
  };

  ModelClass.findByIdAndUpdate = async (id, update, options = {}) => {
    const items = mockModelInstance._read();
    const idx = items.findIndex(item => item._id === id);
    if (idx < 0) return null;

    let current = items[idx];
    const cleanUpdate = { ...update };
    
    if (update.$set) {
      Object.assign(current, update.$set);
      delete cleanUpdate.$set;
    }
    if (update.$push) {
      for (const field in update.$push) {
        if (!Array.isArray(current[field])) current[field] = [];
        current[field].push(update.$push[field]);
      }
      delete cleanUpdate.$push;
    }
    if (update.$pull) {
      for (const field in update.$pull) {
        if (Array.isArray(current[field])) {
          const pullVal = update.$pull[field];
          current[field] = current[field].filter(v => {
            if (typeof pullVal === 'object' && pullVal !== null) {
              return v._id !== pullVal._id;
            }
            return v !== pullVal;
          });
        }
      }
      delete cleanUpdate.$pull;
    }

    Object.assign(current, cleanUpdate);
    current.updatedAt = new Date().toISOString();

    items[idx] = current;
    mockModelInstance._write(items);

    return new ModelClass(current);
  };

  ModelClass.findByIdAndDelete = async (id) => {
    const items = mockModelInstance._read();
    const idx = items.findIndex(item => item._id === id);
    if (idx < 0) return null;
    const removed = items.splice(idx, 1)[0];
    mockModelInstance._write(items);
    return new ModelClass(removed);
  };

  ModelClass.countDocuments = async (query = {}) => {
    const items = mockModelInstance._read();
    return items.filter(item => mockModelInstance._match(item, query)).length;
  };

  ModelClass.updateOne = async (query, update) => {
    const items = mockModelInstance._read();
    const idx = items.findIndex(item => mockModelInstance._match(item, query));
    if (idx >= 0) {
      let current = items[idx];
      if (update.$set) {
        Object.assign(current, update.$set);
      } else {
        Object.assign(current, update);
      }
      current.updatedAt = new Date().toISOString();
      items[idx] = current;
      mockModelInstance._write(items);
      return { nModified: 1 };
    }
    return { nModified: 0 };
  };

  ModelClass.deleteOne = async (query) => {
    const items = mockModelInstance._read();
    const idx = items.findIndex(item => mockModelInstance._match(item, query));
    if (idx >= 0) {
      items.splice(idx, 1);
      mockModelInstance._write(items);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  };

  return ModelClass;
}
