
import { User } from './user.model';


export interface ProjectMini {
  id:  number;
  nom: string;
}


export interface Report {
  id:         number;
  fileName:   string;
  filePath:   string;
  uploadDate: string;        
  format:     string;        
  status?:    string;        
  project?:   ProjectMini;   
  sender?:    User;          
  recipient?: User | null;   
}
