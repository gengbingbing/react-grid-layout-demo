import React, { ReactNode } from 'react';
import cx from 'classnames';

type ButtonGroupProps = {
  children: ReactNode;
  size?: 'large' | 'default' | 'small';
  style?:any;
  className?: string;
};

/**
 * 按钮组组件，用于将多个按钮组合在一起
 */
const ButtonGroup: React.FC<ButtonGroupProps> = ({ 
  children, 
  size = 'default',
  style,
  className
}) => {
  const classNames = cx(
    'btn-group',
    size !== 'default' && `btn-group-${size}`,
    className
  );

  return (
    <div className={classNames} style={style}>
      {children}
    </div>
  );
};

export default ButtonGroup; 