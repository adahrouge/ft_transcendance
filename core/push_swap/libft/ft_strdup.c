/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_strdup.c                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: abouraad <abouraad@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/12 14:16:12 by abouraad          #+#    #+#             */
/*   Updated: 2024/08/08 14:04:55 by abouraad         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"
//#include <stdlib.h>

char	*ft_strdup(const char *s)
{
	size_t	size;
	char	*newstr;

	size = ft_strlen(s);
	newstr = (char *)malloc(sizeof(char) * (size + 1));
	if (!newstr)
		return (NULL);
	newstr[size] = '\0';
	while (size-- > 0)
	{
		newstr[size] = s[size];
	}
	return (newstr);
}
