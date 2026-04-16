import { Avatar } from '../ui';
import styles from './user.module.css';

export default function UserHeader({ user }) {
  return (
    <div className={styles.header}>
      <div className={styles.avatarContainer}>
        <Avatar name={user.name} size={80} src={user.avatar} />
      </div>
      <h1 className={styles.title}>{user.name}</h1>
      <div className={styles.username}>@{user.username}</div>
      <div className={styles.joinDate}>{user.joinDate}</div>
      <p className={styles.bio}>{user.bio}</p>
    </div>
  );
}
