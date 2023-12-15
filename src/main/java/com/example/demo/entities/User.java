pacakage com.example.demo.entities;

import org.hibernate.annotations.CreationTimestamp;
import org.hibertnate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.util.Date;

@Table(name = "user")
@Entity
public class User {
        @Id
        @GeneratedValue(strategy = GenerationType.AUTO)
        @Column(nullable = false)
        private Integer id;

        @Column(unique = true, length = 200, nullable = false)
        private String username;

        @Column(length = 200, nullable = false)
        private String password;

        @CreationTimestamp
        @Column(updatable = false, name = "created_at")
        private Date createdAt;

        @UpdateTimestamp
        @Column(name = "updated_at")
        private Date updatedAt;

        public Integer getId() {
                return id;
        }

        public void setId(Integer id) {
                this.id = id;
        }

        public String getUsername() {
                return username;
        }

        public void setUsername(String username) {
                this.username = username;
        }

        public String getPassword() {
                return password;
        }

        public void setPassword(String password) {
                this.password = password;
        }

        public Date getCreatedAt() {
		            return createdAt;
	      }

	      public void setCreatedAt(Date createdAt) {
		            this.createdAt = createdAt;
	      }

	      public Date getUpdatedAt() {
		            return updatedAt;
	      }

	      public void setUpdatedAt(Date updatedAt) {
		            this.updatedAt = updatedAt;
	      }
}
