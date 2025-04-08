import React from 'react';
import { 
  FiInbox, 
  FiAlertTriangle, 
  FiEdit2,
  ShowChart
} from '../icons';

/**
 * Composant d'exemple montrant comment utiliser les icônes Feather
 * Ce composant sert de référence pour corriger les autres composants
 */
const IconExample: React.FC = () => {
  return (
    <div className="icon-examples">
      <h2>Exemples d'utilisation des icônes</h2>
      
      <div className="icon-row">
        <div className="icon-item">
          <FiInbox size={24} />
          <span>FiInbox</span>
        </div>
        
        <div className="icon-item">
          <FiAlertTriangle size={24} />
          <span>FiAlertTriangle</span>
        </div>
        
        <div className="icon-item">
          <FiEdit2 size={24} />
          <span>FiEdit2</span>
        </div>
        
        <div className="icon-item">
          <ShowChart size={24} />
          <span>ShowChart (Material Design)</span>
        </div>
      </div>
      
      <div className="icon-usage">
        <h3>Comment utiliser les icônes</h3>
        <pre>
          {`
// 1. Importer depuis le fichier centralisé
import { FiInbox } from '../icons';

// 2. Utiliser comme un composant React normal
<FiInbox size={24} />

// 3. Personnaliser avec des props
<FiInbox 
  size={32}
  color="blue"
  strokeWidth={1.5}
  className="custom-icon"
/>
          `}
        </pre>
      </div>
    </div>
  );
};

export default IconExample;
